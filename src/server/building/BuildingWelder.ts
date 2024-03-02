import { ServerStorage, Workspace } from "@rbxts/services";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Element } from "shared/Element";
import Logger from "shared/Logger";
import BlockManager from "shared/building/BlockManager";
import { Arrays } from "shared/fixes/Arrays";

type CollidersModel = Model & { readonly ___nominal: "CollidersModel" };
export default class BuildingWelder {
	private static readonly weldColliders = new Map<string, CollidersModel>();
	private static readonly plotColliders = new Map<PlotModel, WorldModel>();

	static initialize() {
		BuildingWelder.initPartBlockCollisions(BlocksInitializer.blocks.sorted);
	}

	private static initPartBlockCollisions(blocks: readonly RegistryBlock[]) {
		const weldFolderName = "WeldRegions";
		const offset = 0.2;
		const region = (center: Vector3, size: Vector3) => {
			return new Region3(center.sub(size.div(2)), center.add(size.div(2)));
		};

		const createAutomatic = (block: BlockModel): readonly Region3[] | undefined => {
			if (
				(block.GetChildren().size() === 1 && block.PrimaryPart!.IsA("Part")) ||
				block.GetAttribute("shape") === "cube"
			) {
				const part = block.FindFirstChildWhichIsA("Part");
				if (!part) return;

				if (part.Shape === Enum.PartType.Block) {
					const blockpos = part.Position;
					const size = (
						block.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[]
					)
						.map((c) => c.Size)
						.reduce((acc, val) => (acc.Magnitude > val.Magnitude ? acc : val), Vector3.zero);

					return [
						region(
							blockpos.add(new Vector3(-size.X / 2, 0, 0)),
							new Vector3(offset, size.Y - offset, size.Z - offset),
						),
						region(
							blockpos.add(new Vector3(size.X / 2, 0, 0)),
							new Vector3(offset, size.Y - offset, size.Z - offset),
						),

						region(
							blockpos.add(new Vector3(0, -size.Y / 2, 0)),
							new Vector3(size.X - offset, offset, size.Z - offset),
						),
						region(
							blockpos.add(new Vector3(0, size.Y / 2, 0)),
							new Vector3(size.X - offset, offset, size.Z - offset),
						),

						region(
							blockpos.add(new Vector3(0, 0, -size.Z / 2)),
							new Vector3(size.X - offset, size.Y - offset, offset),
						),
						region(
							blockpos.add(new Vector3(0, 0, size.Z / 2)),
							new Vector3(size.X - offset, size.Y - offset, offset),
						),
					];
				}
			}
		};

		const setColliderProperties = (collider: BasePart) => {
			collider.Transparency = 1;
			collider.Material = Enum.Material.Plastic;
			collider.Anchored = true;
			collider.Massless = true;
			collider.CollisionGroup = "BlockCollider";
			collider.CanCollide = true;
			collider.CanTouch = false;
			collider.EnableFluidForces = false;
		};

		const unionCache: [Vector3, UnionOperation][] = [];

		for (const regblock of blocks) {
			const block = regblock.model;
			block.PrimaryPart!.Anchored = true;

			const weldParent = Element.create("Model") as CollidersModel;
			weldParent.WorldPivot = block.GetPivot();
			this.weldColliders.set(regblock.id, weldParent);

			if (block.FindFirstChild(weldFolderName)) {
				const colliders = block.FindFirstChild(weldFolderName)?.GetChildren() as unknown as readonly BasePart[];
				if (colliders.size() === 0) continue;

				for (const [key, group] of Arrays.groupBy(
					colliders,
					(g) => (g.GetAttribute("target") as string | undefined) ?? "",
				)) {
					if (group.size() < 2) {
						for (const collider of group) {
							const newcollider = collider.Clone();
							setColliderProperties(newcollider);
							newcollider.Parent = weldParent;
						}
						continue;
					}

					const union = group[0].UnionAsync(
						group.filter((_, i) => i !== 0),
						Enum.CollisionFidelity.PreciseConvexDecomposition,
					);
					setColliderProperties(union);
					if (key !== "") {
						(block as unknown as Record<string, BasePart>)[key].Anchored = true;
						union.SetAttribute("target", key);
					}

					union.Parent = weldParent;

					for (const collider of group) {
						collider.Destroy();
					}
				}

				block.FindFirstChild(weldFolderName)?.Destroy();
				continue;
			}

			const blocksize = (block.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[])
				.map((c) => c.Size)
				.reduce((acc, val) => (acc.Magnitude > val.Magnitude ? acc : val), Vector3.zero);

			let union = unionCache.find(([size]) => size === blocksize)?.[1];
			if (union) {
				union = union.Clone();
				union.PivotTo(block.GetPivot());
				union.Parent = weldParent;
			} else {
				const regions = createAutomatic(block);
				if (!regions || regions.size() === 0) continue;

				const parts: BasePart[] = [];
				for (const region of regions) {
					const part = Element.create("Part", { Parent: Workspace, Size: region.Size });
					part.PivotTo(region.CFrame);
					parts.push(part);
				}

				union = parts[0].UnionAsync(
					parts.filter((_, i) => i !== 0),
					Enum.CollisionFidelity.PreciseConvexDecomposition,
				);

				for (const part of parts) {
					part.Destroy();
				}

				setColliderProperties(union);
				unionCache.push([blocksize, union]);
				union.Parent = weldParent;
			}

			print(`[BLOCKINIT] Adding automatic region to ${block.Name}`);
		}

		print("[BLOCKINIT] Block welding initialized");
	}

	private static getPlotColliders(plot: PlotModel): WorldModel {
		let colliderModel = this.plotColliders.get(plot);
		if (colliderModel) return colliderModel;

		colliderModel = Element.create("WorldModel", { Parent: ServerStorage, Name: "PlotCollision" });
		this.plotColliders.set(plot, colliderModel);
		return colliderModel;
	}

	static deleteWelds(plot: PlotModel) {
		this.getPlotColliders(plot).ClearAllChildren();
	}
	static deleteWeld(plot: PlotModel, block: BlockModel) {
		(this.getPlotColliders(plot) as unknown as Record<BlockUuid, CollidersModel>)[
			BlockManager.getUuidByModel(block)
		].Destroy();
	}

	static weldOnPlot(plot: PlotModel, block: BlockModel) {
		const collider = this.weldColliders.get(BlockManager.getIdByModel(block))?.Clone();
		if (!collider) return;

		collider.Name = BlockManager.getUuidByModel(block);
		collider.PivotTo(block.GetPivot());
		collider.Parent = this.getPlotColliders(plot);

		this.weld(plot, collider);
	}

	private static weld(plot: PlotModel, colliders: CollidersModel) {
		const getTarget = (collider: BasePart): BasePart | undefined => {
			const targetBlock = (plot.Blocks as unknown as Record<string, BlockModel>)[collider.Parent!.Name];
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
				Logger.error("Found a non-BasePart in a collider!!!");
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

	static moveCollisions(plot: PlotModel, block: BlockModel, newpivot: CFrame) {
		const child = this.getPlotColliders(plot).FindFirstChild(BlockManager.getUuidByModel(block)) as
			| CollidersModel
			| undefined;
		if (!child) throw "what";

		this.unweldFromOtherBlocks(block);
		child.PivotTo(newpivot);
		this.weld(plot, child);
	}

	static makeJoints(part0: BasePart, part1: BasePart) {
		const weld = new Instance("WeldConstraint");

		weld.Part0 = part0;
		weld.Part1 = part1;
		weld.Name = "AutoWeld";

		weld.Parent = part0;
	}

	static unweld(model: BlockModel): Set<BasePart> {
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

	static unweldFromOtherBlocks(model: BlockModel): Set<BasePart> {
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
