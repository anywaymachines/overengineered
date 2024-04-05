import { RunService, Workspace } from "@rbxts/services";
import { Logger } from "shared/Logger";
import { RemoteEvents } from "shared/RemoteEvents";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import { BlockManager, PlacedBlockData } from "shared/building/BlockManager";
import { Component } from "shared/component/Component";
import { Objects } from "shared/fixes/objects";
import { PartUtils } from "shared/utils/PartUtils";
import { PlayerUtils } from "shared/utils/PlayerUtils";

const overlapParams = new OverlapParams();
overlapParams.CollisionGroup = "Blocks";

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

	private breakQueue: BasePart[] = [];
	private burnQueue: BasePart[] = [];

	private readonly blocksStrength = 70;
	private readonly cylindricalBlocksStrength = 1500;
	private readonly waterDiffMultiplier = 4.5;
	private readonly playerCharacterDiffMultiplier = 4;

	static isImpactAllowed(part: BasePart) {
		if (
			!part.CanTouch ||
			!part.CanCollide ||
			!part.CanQuery ||
			part.Massless ||
			part.Transparency === 1 ||
			part.IsA("VehicleSeat") ||
			math.max(part.Size.X, part.Size.Y, part.Size.Z) < 0.5
		) {
			return false;
		}
		return true;
	}

	constructor(blocks: readonly PlacedBlockData[]) {
		super();

		task.delay(0.1, () => {
			for (const block of blocks) {
				this.subscribeOnBlock(block);
			}
		});

		this.event.subscribe(RunService.Heartbeat, (dT) => {
			if (this.breakQueue.size() > 0) {
				RemoteEvents.ImpactBreak.send(this.breakQueue);
				this.breakQueue.clear();
			}

			if (this.burnQueue.size() > 0) {
				RemoteEvents.Burn.send(this.burnQueue);
				this.burnQueue.clear();
			}
		});
	}

	subscribeOnBlock(block: PlacedBlockData) {
		for (const part of block.instance.GetDescendants()) {
			if (!part.IsA("BasePart")) continue;
			if (!ImpactController.isImpactAllowed(part)) continue;

			this.subscribeOnBasePart(part);
		}
	}

	subscribeOnBasePart(part: BasePart) {
		// Optimization (do nothing for non-connected blocks)
		if (part.AssemblyMass === part.Mass) {
			return;
		}

		let partPower =
			part.IsA("Part") && part.Shape === Enum.PartType.Cylinder
				? this.cylindricalBlocksStrength
				: this.blocksStrength;

		// Material protection
		partPower *= materialStrongness[part.Material.Name];

		const event = part.Touched.Connect((hit: BasePart | Terrain) => {
			// Optimization (do nothing for non-connected blocks)
			if (part.AssemblyMass === part.Mass) {
				event.Disconnect();
				return;
			}

			// Do nothing for non-collidable blocks
			if (!hit.CanCollide) return;

			// Don't let the blocks collapse too much
			// if (part.AssemblyMass < part.Mass * 7) {
			// 	event.Disconnect();
			// 	return;
			// }

			let allowedDifference = partPower;

			// Randomness
			allowedDifference += math.random(0, 30);

			// Terrain Water
			if (part.CFrame.Y < TerrainDataInfo.waterLevel + 4) {
				allowedDifference *= this.waterDiffMultiplier;
			}

			// Player character diff
			if (PlayerUtils.isPlayerPart(hit)) {
				allowedDifference *= this.playerCharacterDiffMultiplier;
			}

			// Compute magnitudes
			const partMagnitude = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const secondPartMagnitude = hit.AssemblyLinearVelocity.Magnitude + hit.AssemblyAngularVelocity.Magnitude;

			const magnitudeDiff = math.abs(partMagnitude - secondPartMagnitude);

			if (magnitudeDiff > allowedDifference * 5) {
				// Pseudo-explode
				const partsInRadius = Workspace.GetPartBoundsInRadius(
					part.Position,
					1 + magnitudeDiff / (allowedDifference * 10),
					overlapParams,
				);

				for (const partInRadius of partsInRadius) {
					if (!BlockManager.isActiveBlockPart(partInRadius) || math.random(1, 3) <= 1) {
						continue;
					}

					this.breakQueue.push(partInRadius);
					PartUtils.BreakJoints(partInRadius);

					const predictedVelocity = partInRadius.Position.sub(part.Position)
						.Unit.mul(2000)
						.div(partInRadius.Mass)
						.div(6080);
					partInRadius.ApplyImpulse(predictedVelocity);
				}

				event.Disconnect();
			} else if (magnitudeDiff > allowedDifference) {
				if (math.random(1, 20) === 1) {
					this.burnQueue.push(part);
				}

				if (math.random(1, 5) > 1) {
					this.breakQueue.push(part);

					event.Disconnect();
				}
			} else if (magnitudeDiff + allowedDifference * 0.2 > allowedDifference) {
				RemoteEvents.Effects.Sparks.sendToNetworkOwnerOrEveryone(part, { part });
			}
		});

		this.events.push(event);
	}

	destroy(): void {
		for (const event of this.events) {
			event.Disconnect();
		}

		this.breakQueue.clear();
		this.burnQueue.clear();

		super.destroy();
	}
}
