import { ServerStorage } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import type { BuildingPlot } from "server/plots/BuildingPlot";
import type { BlockRegistry } from "shared/block/BlockRegistry";

export class PlotWelder extends Component {
	readonly collidersParent: WorldModel;

	constructor(
		private readonly plot: BuildingPlot,
		private readonly blockRegistry: BlockRegistry,
	) {
		super();

		this.collidersParent = new Instance("WorldModel");
		this.collidersParent.Name = "PlotCollision";
		this.collidersParent.Parent = ServerStorage;

		ComponentInstance.init(this, this.collidersParent);
	}

	deleteWelds() {
		this.collidersParent.ClearAllChildren();
	}
	deleteWeld(block: BlockModel) {
		this.collidersParent.FindFirstChild(BlockManager.manager.uuid.get(block))?.Destroy();
	}

	weldOnPlot(block: BlockModel) {
		const collider = this.blockRegistry.blocks.get(BlockManager.manager.id.get(block)!)!.weldColliders?.Clone();
		if (!collider) return;

		collider.Name = BlockManager.manager.uuid.get(block);
		collider.PivotTo(block.GetPivot());
		collider.Parent = this.collidersParent;

		this.weld(collider);
	}

	private weld(colliders: Model) {
		const getTarget = (collider: BasePart): BasePart | undefined => {
			const targetBlock = this.plot.getBlock(collider.Parent!.Name as BlockUuid);
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

	moveCollisions(block: BlockModel, newpivot: CFrame) {
		const child = this.collidersParent.FindFirstChild(BlockManager.manager.uuid.get(block)) as Model | undefined;
		if (!child) throw "what";

		this.unweldFromOtherBlocks(block);
		child.PivotTo(newpivot);
		this.weld(child);
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
