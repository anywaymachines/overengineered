import { RunService, ServerStorage, Workspace } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { BuildingPlot } from "shared/building/BuildingPlot";

/** {@link PlotWelder} that automatically subscribes to {@link BuildingPlot} block changing */
@injectable
export class AutoPlotWelder extends Component {
	constructor(plot: BuildingPlot, @inject blockRegistry: BlockRegistry) {
		super();

		const welder = this.parent(new PlotWelder(plot, blockRegistry));

		this.event.subscribe(plot.placeOperation.executed, (arg, result) => welder.weldOnPlot(result.model));
		this.event.subscribe(plot.deleteOperation.executed, (arg, result) => {
			if (arg === "all") {
				welder.deleteWelds();
			} else {
				for (const block of arg) {
					welder.unweld(block);
					welder.deleteWeld(block);
				}
			}
		});

		this.event.subscribe(plot.editOperation.executing, (arg) => {
			for (const edit of arg) {
				welder.unweldFromOtherBlocks(edit.instance);
			}
		});
		this.event.subscribe(plot.editOperation.executed, (arg) => {
			for (const edit of arg) {
				welder.moveCollisions(edit.instance, edit.instance.GetPivot());
			}
		});
	}
}

@injectable
export class PlotWelder extends Component {
	readonly collidersParent: WorldModel;

	constructor(
		private readonly plot: BuildingPlot,
		@inject private readonly blockRegistry: BlockRegistry,
	) {
		super();

		this.collidersParent = new Instance("WorldModel");
		this.collidersParent.Name = "PlotCollision";
		this.collidersParent.Parent = RunService.IsClient() ? Workspace : ServerStorage;

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

	static getWeldsToOtherBlocks(model: BlockModel): Set<Constraint | JointInstance> {
		const result = new Set<Constraint | JointInstance>();

		const modelParts = model.GetChildren().filter((value) => value.IsA("BasePart") && value.CanCollide);
		for (let i = 0; i < modelParts.size(); i++) {
			const modelPart = modelParts[i] as BasePart;
			const welds = modelPart.GetJoints();
			for (const weld of welds) {
				result.add(weld);
			}
		}

		return result;
	}
	unweldFromOtherBlocks(model: BlockModel): void {
		for (const weld of PlotWelder.getWeldsToOtherBlocks(model)) {
			weld.Destroy();
		}
	}
}
