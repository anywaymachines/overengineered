import { ServerStorage } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { Element } from "shared/Element";
import { HostedService } from "shared/GameHost";
import type { BuildingPlot } from "server/plots/BuildingPlot";
import type { BlockRegistry } from "shared/block/BlockRegistry";

@injectable
export class BuildingWelder extends HostedService {
	private readonly plotColliders = new Map<BuildingPlot, WorldModel>();

	constructor(@inject private readonly blockRegistry: BlockRegistry) {
		super();

		this.onEnable(() => {
			this.onDestroy(() => {
				for (const [, collider] of this.plotColliders) {
					collider.Destroy();
				}
				this.plotColliders.clear();
			});
		});
	}

	private getPlotColliders(plot: BuildingPlot): WorldModel {
		let colliderModel = this.plotColliders.get(plot);
		if (colliderModel) return colliderModel;

		colliderModel = Element.create("WorldModel", { Parent: ServerStorage, Name: "PlotCollision" });
		this.plotColliders.set(plot, colliderModel);
		return colliderModel;
	}

	deleteWelds(plot: BuildingPlot) {
		this.getPlotColliders(plot).ClearAllChildren();
	}
	deleteWeld(plot: BuildingPlot, block: BlockModel) {
		this.getPlotColliders(plot).FindFirstChild(BlockManager.manager.uuid.get(block))?.Destroy();
	}

	weldOnPlot(plot: BuildingPlot, block: BlockModel) {
		const collider = this.blockRegistry.blocks.get(BlockManager.manager.id.get(block)!)!.weldColliders?.Clone();
		if (!collider) return;

		collider.Name = BlockManager.manager.uuid.get(block);
		collider.PivotTo(block.GetPivot());
		collider.Parent = this.getPlotColliders(plot);

		this.weld(plot, collider);
	}

	private weld(plot: BuildingPlot, colliders: Model) {
		const getTarget = (collider: BasePart): BasePart | undefined => {
			const targetBlock = plot.getBlock(collider.Parent!.Name as BlockUuid);
			let part: BasePart | undefined;

			const targetstr = collider.GetAttribute("target") as string | undefined;
			if (targetstr !== undefined) {
				part = (targetBlock as unknown as Record<string, BasePart>)[targetstr];
			}

			return (
				part ??
				(targetBlock.GetChildren().find((c) => c.Name.lower() !== "colbox" && c.IsA("BasePart")) as
					| BasePart
					| undefined) ??
				targetBlock.PrimaryPart
			);
		};

		for (const collider of colliders.GetChildren()) {
			if (!collider.IsA("BasePart")) {
				$err("Found a non-BasePart in a collider!!!");
				continue;
			}

			const touchingWith = (colliders.Parent as WorldRoot).GetPartsInPart(collider);
			if (touchingWith.size() === 0) continue;

			const targetPart = getTarget(collider);
			if (!targetPart) continue;

			for (const anotherCollider of touchingWith) {
				const anotherTargetPart = getTarget(anotherCollider);
				if (!anotherTargetPart) continue;

				this.makeJoints(targetPart, anotherTargetPart);
			}
		}
	}

	moveCollisions(plot: BuildingPlot, block: BlockModel, newpivot: CFrame) {
		const child = this.getPlotColliders(plot).FindFirstChild(BlockManager.manager.uuid.get(block)) as
			| Model
			| undefined;
		if (!child) throw "what";

		this.unweldFromOtherBlocks(block);
		child.PivotTo(newpivot);
		this.weld(plot, child);
	}

	makeJoints(part0: BasePart, part1: BasePart) {
		const weld = new Instance("WeldConstraint");

		weld.Part0 = part0;
		weld.Part1 = part1;
		weld.Name = "AutoWeld";

		weld.Parent = part0;
	}

	unweld(model: BlockModel): Set<BasePart> {
		const connected = new Set<BasePart>();

		const modelParts = model.GetChildren().filter((value) => value.IsA("BasePart") && value.CanCollide);
		for (let i = 0; i < modelParts.size(); i++) {
			const modelPart = modelParts[i] as BasePart;
			const welds = modelPart.GetJoints();
			welds.forEach((element) => {
				if (element.IsA("Constraint")) {
					if (element.Attachment0?.Parent?.IsA("BasePart")) {
						connected.add(element.Attachment0.Parent);
					}
					if (element.Attachment1?.Parent?.IsA("BasePart")) {
						connected.add(element.Attachment1.Parent);
					}
				} else {
					if (element.Part0) connected.add(element.Part0);
					if (element.Part1) connected.add(element.Part1);
				}

				element.Destroy();
			});
		}

		return connected;
	}

	unweldFromOtherBlocks(model: BlockModel): Set<BasePart> {
		const connected = new Set<BasePart>();

		const modelParts = model.GetChildren().filter((value) => value.IsA("BasePart") && value.CanCollide);
		for (let i = 0; i < modelParts.size(); i++) {
			const modelPart = modelParts[i] as BasePart;
			const welds = modelPart.GetJoints();
			welds.forEach((element) => {
				if (element.IsA("Constraint")) {
					if (
						(element.Attachment0?.Parent?.IsDescendantOf(model) ?? true) &&
						(element.Attachment1?.Parent?.IsDescendantOf(model) ?? true)
					) {
						return;
					}

					if (element.Attachment0?.Parent?.IsA("BasePart")) {
						connected.add(element.Attachment0.Parent);
					}
					if (element.Attachment1?.Parent?.IsA("BasePart")) {
						connected.add(element.Attachment1.Parent);
					}
				} else {
					if (
						(element.Part0?.IsDescendantOf(model) ?? true) &&
						(element.Part1?.IsDescendantOf(model) ?? true)
					) {
						return;
					}

					if (element.Part0) connected.add(element.Part0);
					if (element.Part1) connected.add(element.Part1);
				}

				element.Destroy();
			});
		}

		return connected;
	}
}
