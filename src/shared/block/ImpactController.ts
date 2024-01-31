import { UnreliableRemotes } from "shared/Remotes";
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

	static initializeBlocks(blocks: readonly PlacedBlockData[]) {
		blocks.forEach((value) => {
			PartUtils.applyToAllDescendantsOfType("BasePart", value.instance, (part) => {
				if (!part.CanTouch || part.Transparency === 1 || part.IsA("VehicleSeat")) {
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

		const event = part.Touched.Connect((secondPart: BasePart) => {
			// Optimization (do nothing for non-connected blocks)
			if (part.AssemblyMass === part.Mass) {
				event.Disconnect();
				return;
			}

			// Do nothing for non-collidable blocks
			if (secondPart.IsA("BasePart") && !secondPart.CanCollide) {
				return;
			}

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
			allowedMagnitudeDiff *= math.max(0.5, part.CurrentPhysicalProperties.Density / 3.5);
			allowedMagnitudeDiff = math.round(allowedMagnitudeDiff);

			const magnitudeDiff = math.round(math.abs(partMagnitude - secondPartMagnitude));

			if (magnitudeDiff > allowedMagnitudeDiff * 5) {
				UnreliableRemotes.ImpactExplode.FireServer(part, 1 + magnitudeDiff / (2 * allowedMagnitudeDiff * 5));
				event.Disconnect();
			} else if (magnitudeDiff > allowedMagnitudeDiff) {
				if (math.random(1, 20) === 1) {
					UnreliableRemotes.Burn.FireServer(part);
					event.Disconnect();
				}

				if (math.random(1, 3) > 1) {
					UnreliableRemotes.ImpactBreak.FireServer(part);
					event.Disconnect();
				}
			} else if (magnitudeDiff + allowedMagnitudeDiff * 0.2 > allowedMagnitudeDiff) {
				Effects.Sparks.send(part, undefined);
			}
		});
	}
}
