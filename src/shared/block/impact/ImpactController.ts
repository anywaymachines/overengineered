import Logger from "shared/Logger";
import RemoteEvents from "shared/RemoteEvents";
import TerrainDataInfo from "shared/TerrainDataInfo";
import BlockManager, { PlacedBlockData } from "shared/building/BlockManager";
import { Component } from "shared/component/Component";
import Effects from "shared/effects/Effects";
import Objects from "shared/fixes/objects";
import PartUtils from "shared/utils/PartUtils";
import PlayerUtils from "shared/utils/PlayerUtils";

const strongBlocks: readonly string[] = ["smallwheel", "wheel"];

const strongBlocksAllowedDiff = 1500;
const objectsAllowedDiff = 70;

const waterDiffMultiplier = 4.5;
const playerCharacterDiffMultiplier = 4;

const materialStrongness: { readonly [k in Enum.Material["Name"]]: number } = Objects.fromEntries(
	Enum.Material.GetEnumItems().map((material) => {
		const physicalProperties = new PhysicalProperties(material);
		const strongness = math.max(0.5, physicalProperties.Density / 3.5);
		Logger.info(`Strongness of '${material.Name}' set to ${strongness}`);

		return [material.Name, strongness] as const;
	}),
);

export class ImpactController extends Component {
	private readonly events: RBXScriptConnection[] = [];

	constructor(blocks: readonly PlacedBlockData[]) {
		super();

		for (const block of blocks) {
			PartUtils.applyToAllDescendantsOfType("BasePart", block.instance, (part) => {
				if (
					!part.CanTouch ||
					!part.CanCollide ||
					!part.CanQuery ||
					part.Massless ||
					part.Transparency === 1 ||
					part.IsA("VehicleSeat") ||
					math.max(part.Size.X, part.Size.Y, part.Size.Z) < 0.5
				) {
					return;
				}

				const event = this.initializeBlock(part);
				if (event) {
					this.events.push(event);
				}
			});
		}
	}

	destroy(): void {
		for (const event of this.events) {
			event.Disconnect();
		}

		super.destroy();
	}

	private initializeBlock(part: BasePart) {
		const blockData = BlockManager.getBlockDataByPart(part);

		if (!blockData) {
			return;
		}

		const event = part.Touched.Connect((hit: BasePart | Terrain) => {
			// Optimization (do nothing for non-connected blocks)
			if (part.AssemblyMass === part.Mass) {
				event.Disconnect();
				return;
			}

			// Do nothing for non-collidable blocks
			if (!hit.CanCollide) return;

			// Don't let the blocks collapse too much
			if (
				part.AssemblyMass < part.Mass * 7 &&
				!strongBlocks.includes(blockData.id) &&
				math.min(part.Size.X, part.Size.Y, part.Size.Z) > 1
			) {
				event.Disconnect();
				return;
			}

			// Default diff
			let allowedMagnitudeDiff: number = strongBlocks.includes(blockData.id)
				? strongBlocksAllowedDiff
				: objectsAllowedDiff;

			// Some randomness
			allowedMagnitudeDiff += math.random(0, 30);

			// Terrain Water
			if (part.CFrame.Y < TerrainDataInfo.getData().waterHeight + 4) {
				allowedMagnitudeDiff *= waterDiffMultiplier;
			}

			// Player character diff
			if (PlayerUtils.isPlayerPart(hit)) {
				allowedMagnitudeDiff *= playerCharacterDiffMultiplier;
			}

			// Compute magnitudes
			const partMagnitude = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const secondPartMagnitude = hit.AssemblyLinearVelocity.Magnitude + hit.AssemblyAngularVelocity.Magnitude;

			// Material protection
			allowedMagnitudeDiff *= materialStrongness[part.Material.Name];
			const magnitudeDiff = math.abs(partMagnitude - secondPartMagnitude);

			if (magnitudeDiff > allowedMagnitudeDiff * 5) {
				//PartUtils.BreakJoints(part);
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
					//PartUtils.BreakJoints(part);
					RemoteEvents.ImpactBreak.send(part);

					event.Disconnect();
				}
			} else if (magnitudeDiff + allowedMagnitudeDiff * 0.2 > allowedMagnitudeDiff) {
				Effects.Sparks.sendToNetworkOwnerOrEveryone(part, { part });
			}
		});

		return event;
	}
}
