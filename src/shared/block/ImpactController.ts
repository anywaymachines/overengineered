import Logger from "shared/Logger";
import RemoteEvents from "shared/RemoteEvents";
import TerrainDataInfo from "shared/TerrainDataInfo";
import BlockManager, { PlacedBlockData } from "shared/building/BlockManager";
import Effects from "shared/effects/Effects";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class ImpactController {
	static STRONG_BLOCKS = ["smallwheel", "wheel"];

	static readonly STRONG_BLOCKS_ALLOWED_DIFF = 1500 as const;
	static readonly OBJECTS_ALLOWED_DIFF = 70 as const;

	static readonly WATER_DIFF_MULTIPLIER = 3 as const;
	static readonly PLAYER_CHARACTER_DIFF_MULTIPLIER = 4 as const;

	static readonly MATERIAL_STRONGNESS: { [key: string]: number } = {};

	static {
		Enum.Material.GetEnumItems().forEach((material) => {
			const physicalProperties = new PhysicalProperties(material);
			const strongness = math.max(0.5, physicalProperties.Density / 3.5);
			this.MATERIAL_STRONGNESS[material.Name] = strongness;
			Logger.info(`Setting strongness '${strongness}' to ${material.Name}`);
		});
	}

	static initializeBlocks(blocks: readonly PlacedBlockData[]) {
		blocks.forEach((value) => {
			PartUtils.applyToAllDescendantsOfType("BasePart", value.instance, (part) => {
				if (
					!part.CanTouch ||
					part.Transparency === 1 ||
					part.IsA("VehicleSeat") ||
					math.max(part.Size.X, part.Size.Y, part.Size.Z) < 0.5
				) {
					return;
				}
				this.initializeBlock(part);
			});
		});
	}

	private static initializeBlock(part: BasePart) {
		const blockData = BlockManager.getBlockDataByPart(part);

		if (!blockData) {
			return;
		}

		const event = part.Touched.Connect((secondPart: BasePart | Terrain) => {
			// Optimization (do nothing for non-connected blocks)
			if (part.AssemblyMass === part.Mass) {
				event.Disconnect();
				return;
			}

			// Do nothing for non-collidable blocks
			if (!secondPart.CanCollide) return;

			// Default diff
			let allowedMagnitudeDiff: number = this.STRONG_BLOCKS.includes(blockData.id)
				? this.STRONG_BLOCKS_ALLOWED_DIFF
				: this.OBJECTS_ALLOWED_DIFF;

			// Some randomness
			allowedMagnitudeDiff += math.random(0, 30);

			// Terrain Water
			if (part.CFrame.Y < TerrainDataInfo.getData().waterHeight + 4) {
				allowedMagnitudeDiff *= this.WATER_DIFF_MULTIPLIER;
			}

			// Player character diff
			if (PlayerUtils.isPlayerPart(secondPart)) {
				allowedMagnitudeDiff *= this.PLAYER_CHARACTER_DIFF_MULTIPLIER;
			}

			// Compute magnitudes
			const partMagnitude = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const secondPartMagnitude =
				secondPart.AssemblyLinearVelocity.Magnitude + secondPart.AssemblyAngularVelocity.Magnitude;

			// Material protection
			allowedMagnitudeDiff *= this.MATERIAL_STRONGNESS[part.Material.Name];
			const magnitudeDiff = math.abs(partMagnitude - secondPartMagnitude);

			if (magnitudeDiff > allowedMagnitudeDiff * 5) {
				RemoteEvents.ImpactExplode.send({
					part,
					blastRadius: 1 + magnitudeDiff / (2 * allowedMagnitudeDiff * 5),
				});
				event.Disconnect();
			} else if (magnitudeDiff > allowedMagnitudeDiff) {
				if (math.random(1, 20) === 1) {
					RemoteEvents.Burn.send(part);
					event.Disconnect();
				}

				if (math.random(1, 5) > 1) {
					RemoteEvents.ImpactBreak.send(part);

					// FIXME: TODO: Make this for all RemoteEvents.ImpactBreak.send();
					part.CustomPhysicalProperties = new PhysicalProperties(
						part.CurrentPhysicalProperties.Density * 1.5,
						part.CurrentPhysicalProperties.Friction * 3.5,
						part.CurrentPhysicalProperties.Elasticity,
					);

					event.Disconnect();
				}
			} else if (magnitudeDiff + allowedMagnitudeDiff * 0.2 > allowedMagnitudeDiff) {
				Effects.Sparks.sendToNetworkOwnerOrEveryone(part, { part });
			}
		});
	}
}
