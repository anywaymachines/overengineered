import Logger from "shared/Logger";
import RemoteEvents from "shared/RemoteEvents";
import TerrainGenerator from "shared/TerrainGenerationController";
import { PlacedBlockData } from "shared/building/BlockManager";
import { Component } from "shared/component/Component";
import Effects from "shared/effects/Effects";
import Objects from "shared/fixes/objects";
import PlayerUtils from "shared/utils/PlayerUtils";

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

	// private breakQueue: BasePart[] = [];
	// private strongBreakQueue: Map<BasePart, number> = new Map();
	// private burnQueue: BasePart[] = [];

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

		for (const block of blocks) {
			this.subscribeOnBlock(block);
		}

		// this.event.subscribe(RunService.Heartbeat, (dT) => {
		// 	if (this.breakQueue.size() > 0) {
		// 		print("breakQueue", this.breakQueue.size());
		// 		RemoteEvents.ImpactBreak.send(this.breakQueue);
		// 		this.breakQueue.clear();
		// 	}

		// 	if (this.strongBreakQueue.size() > 0) {
		// 		print("strongBreakQueue", this.strongBreakQueue.size());
		// 		RemoteEvents.ImpactExplode.send({ parts: this.strongBreakQueue });
		// 		this.strongBreakQueue.clear();
		// 	}

		// 	if (this.burnQueue.size() > 0) {
		// 		print("burnQueue", this.burnQueue.size());
		// 		RemoteEvents.Burn.send(this.burnQueue);
		// 		this.burnQueue.clear();
		// 	}
		// });
	}

	subscribeOnBlock(block: PlacedBlockData) {
		const parts = block.instance
			.GetDescendants()
			.filter((value) => value.IsA("BasePart") && ImpactController.isImpactAllowed(value)) as BasePart[];

		parts.forEach((part) => {
			this.subscribeOnBasePart(part);
		});
	}

	subscribeOnBasePart(part: BasePart) {
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

			let allowedDifference = partPower;

			// Randomness
			allowedDifference += math.random(0, 30);

			// Terrain Water
			if (part.CFrame.Y < TerrainGenerator.instance.waterLevel) {
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
				//this.strongBreakQueue.set(part, 1 + magnitudeDiff / (allowedDifference * 10));

				RemoteEvents.ImpactExplode.send({
					parts: new Map([[part, 1 + magnitudeDiff / (allowedDifference * 10)]]),
				});

				event.Disconnect();
			} else if (magnitudeDiff > allowedDifference) {
				if (math.random(1, 20) === 1) {
					//this.burnQueue.push(part);

					RemoteEvents.Burn.send([part]);
				}

				if (math.random(1, 5) > 1) {
					//this.breakQueue.push(part);

					RemoteEvents.ImpactBreak.send([part]);

					event.Disconnect();
				}
			} else if (magnitudeDiff + allowedDifference * 0.2 > allowedDifference) {
				Effects.Sparks.sendToNetworkOwnerOrEveryone(part, { part });
			}
		});

		this.events.push(event);
	}

	destroy(): void {
		for (const event of this.events) {
			event.Disconnect();
		}

		super.destroy();
	}
}
