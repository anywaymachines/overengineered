import { RunService, Workspace } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { Objects } from "engine/shared/fixes/Objects";
import { PlayerUtils } from "engine/shared/utils/PlayerUtils";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import { TagUtils } from "shared/utils/TagUtils";
import type { SparksEffect } from "shared/effects/SparksEffect";

const overlapParams = new OverlapParams();
overlapParams.CollisionGroup = "Blocks";

const materialStrength: { readonly [k in Enum.Material["Name"]]: number } = Objects.fromEntries(
	Enum.Material.GetEnumItems().map((material) => {
		const physicalProperties = new PhysicalProperties(material);
		const strongness = math.max(0.5, physicalProperties.Density / 3.5);
		$debug(`Strength of '${material.Name}' set to ${strongness}`);

		return [material.Name, strongness] as const;
	}),
);

const getVolume = (vector: Vector3) => vector.X * vector.Y * vector.Z;

@injectable
export class ImpactController extends Component {
	private readonly events: RBXScriptConnection[] = [];

	private breakQueue: BasePart[] = [];
	private burnQueue: BasePart[] = [];

	private readonly blocksStrength = 70;
	private readonly cylindricalBlocksStrength = 1500;
	private readonly waterDiffMultiplier = 4.5;
	private readonly playerCharacterDiffMultiplier = 64;

	static isImpactAllowed(part: BasePart) {
		if (
			!part.CanTouch ||
			!part.CanCollide ||
			part.IsA("VehicleSeat") ||
			math.max(part.Size.X, part.Size.Y, part.Size.Z) < 0.5
		) {
			return false;
		}
		return true;
	}

	constructor(
		blocks: readonly { readonly instance: BlockModel }[],
		@inject private readonly sparksEffect: SparksEffect,
		//@inject private readonly blockDamageController: BlockDamageController,
	) {
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

	subscribeOnBlock(block: { readonly instance: BlockModel }) {
		// init health
		//this.blockDamageController.initHealth(block.instance);

		for (const part of block.instance.GetDescendants()) {
			if (!part.IsA("BasePart")) continue;
			if (!ImpactController.isImpactAllowed(part)) continue;

			this.subscribeOnBasePart(part);
		}
	}

	subscribeOnBasePart(part: BasePart) {
		// Optimization (do nothing for non-connected blocks)
		if (part.GetJoints().size() === 0) return;

		// do nothing for disabled impact
		if (part.HasTag(TagUtils.allTags.IMPACT_UNBREAKABLE)) return;

		let partPower: number = this.blocksStrength;
		if (part.IsA("Part") && part.Shape === Enum.PartType.Cylinder) {
			partPower = this.cylindricalBlocksStrength * math.max(1, getVolume(part.ExtentsSize) / 16);
			// TODO: 2π r h + 2π r²
			// TODONT?
		}

		if (part.HasTag(TagUtils.allTags.IMPACT_STRONG)) partPower *= 2;

		// Material protection
		partPower *= materialStrength[part.Material.Name];

		// there was no need to randomize the actual damage
		// just randomized the health since it's literally the same effect
		// - @samlovebutter
		const randomHealthPercentMultiplier = 0.5;
		partPower *= 1 + (math.random(0, 100) / 100) * randomHealthPercentMultiplier;

		const event = part.Touched.Connect((hit: BasePart | Terrain) => {
			// Optimization (do nothing for non-connected blocks)
			if (part.AssemblyMass === part.Mass) {
				// I kinda see a flaw in that logic but alright
				// - @samlovebutter
				event.Disconnect();
				return;
			}

			// Do nothing for non-collidable blocks
			if (!hit.CanCollide) return;

			let allowedDifference = partPower;

			// Terrain Water

			if (part.CFrame.Y < TerrainDataInfo.waterLevel + 4) {
				// there is no water check?
				// like where is map type check
				// what if map lacks water and the ground is too low?
				// - @samlovebutter
				allowedDifference *= this.waterDiffMultiplier;
			}

			// Player character diff
			if (PlayerUtils.isPlayerPart(hit)) {
				// honestly I have no idea what this all gotta be
				// - @samlovebutter
				allowedDifference *= this.playerCharacterDiffMultiplier;
			}

			// Compute magnitudes
			const partSpeed = part.AssemblyLinearVelocity.Magnitude + part.AssemblyAngularVelocity.Magnitude;
			const secondPartSpeed = hit.AssemblyLinearVelocity.Magnitude + hit.AssemblyAngularVelocity.Magnitude;

			const speedDiff = math.abs(partSpeed - secondPartSpeed);

			// push element early so I can simplify code
			// it's all sync anyway
			// @samlovebutter
			this.events.push(event);

			if (speedDiff > allowedDifference * 5) {
				// Pseudo-explode
				const partsInRadius = Workspace.GetPartBoundsInRadius(
					part.Position,
					math.min(1 + speedDiff / (allowedDifference * 10), 7500),
					overlapParams,
				);

				for (const partInRadius of partsInRadius) {
					if (!BlockManager.isActiveBlockPart(partInRadius) || math.random(0, 100) < 33) continue;

					this.breakQueue.push(partInRadius);

					// this constant 0,328947 is just (2000 / 6080)
					const massWithMultipliers = 0.3289473684210526 / partInRadius.Mass;

					// it was (Unit*2000)/6080/mass before
					// just simplified things
					const predictedVelocity = partInRadius.Position.sub(part.Position).Unit.div(massWithMultipliers);

					partInRadius.ApplyImpulse(predictedVelocity);
				}

				event.Disconnect();
				return;
			}

			if (speedDiff > allowedDifference) {
				// 5% chance to put things on fire
				if (math.random(0, 100) < 5) {
					this.burnQueue.push(part);
				}

				// 80% chance to break things
				if (math.random(0, 100) < 80) {
					this.breakQueue.push(part);

					event.Disconnect();
				}
				return;
			}

			if (speedDiff + allowedDifference * 0.2 > allowedDifference) {
				this.sparksEffect.send(part, { part });
				return;
			}
		});
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
