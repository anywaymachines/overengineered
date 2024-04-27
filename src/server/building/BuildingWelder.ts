import { RunService, ServerStorage, Workspace } from "@rbxts/services";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Element } from "shared/Element";
import { Logger } from "shared/Logger";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";

const logger = new Logger("BuildingWelder");

type CollidersModel = Model & { readonly ___nominal: "CollidersModel" };
export namespace BuildingWelder {
	const weldColliders = new Map<string, CollidersModel>();
	const plotColliders = new Map<PlotModel, WorldModel>();

	export function initialize() {
		initPartBlockCollisions(BlocksInitializer.blocks.sorted);
	}

	function initPartBlockCollisions(blocks: readonly RegistryBlock[]) {
		const weldFolderName = "WeldRegions";
		const offset = 0.2;
		const region = (center: Vector3, size: Vector3) => {
			return new Region3(center.sub(size.div(2)), center.add(size.div(2)));
		};

		const createAutomatic = (block: RegistryBlock): readonly Region3[] | undefined => {
			const autoShape = block.autoWeldShape ?? "none";
			if (
				(block.model.GetChildren().size() === 1 &&
					block.model.PrimaryPart!.IsA("Part") &&
					block.model.PrimaryPart!.Shape === Enum.PartType.Block) ||
				autoShape === "cube"
			) {
				const part = block.model.FindFirstChildWhichIsA("Part");
				if (!part) return;

				if (part.Shape === Enum.PartType.Block) {
					const blockpos = part.Position;
					const size = (
						block.model.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[]
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
			weldColliders.set(regblock.id, weldParent);

			if (block.FindFirstChild(weldFolderName)) {
				const colliders = block.FindFirstChild(weldFolderName)?.GetChildren() as unknown as readonly BasePart[];
				if (colliders.size() === 0) continue;

				for (const [key, group] of colliders.groupBy(
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
						// Default in studio for loading performance
						RunService.IsStudio()
							? Enum.CollisionFidelity.Default
							: Enum.CollisionFidelity.PreciseConvexDecomposition,
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
				const regions = createAutomatic(regblock);
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

			logger.info(`Adding automatic region to ${block.Name}`);
		}

		logger.info("Block welding initialized");
	}

	function getPlotColliders(plot: PlotModel): WorldModel {
		let colliderModel = plotColliders.get(plot);
		if (colliderModel) return colliderModel;

		colliderModel = Element.create("WorldModel", { Parent: ServerStorage, Name: "PlotCollision" });
		plotColliders.set(plot, colliderModel);
		return colliderModel;
	}

	export function deleteWelds(plot: PlotModel) {
		getPlotColliders(plot).ClearAllChildren();
	}
	export function deleteWeld(plot: PlotModel, block: BlockModel) {
		(getPlotColliders(plot) as unknown as Record<BlockUuid, CollidersModel>)[
			BlockManager.manager.uuid.get(block)
		].Destroy();
	}

	export function weldOnPlot(plot: PlotModel, block: BlockModel) {
		const collider = weldColliders.get(BlockManager.manager.id.get(block))?.Clone();
		if (!collider) return;

		collider.Name = BlockManager.manager.uuid.get(block);
		collider.PivotTo(block.GetPivot());
		collider.Parent = getPlotColliders(plot);

		weld(plot, collider);
	}

	function weld(plot: PlotModel, colliders: CollidersModel) {
		const getTarget = (collider: BasePart): BasePart | undefined => {
			const targetBlock = SharedPlots.getBlockByUuid(plot, collider.Parent!.Name as BlockUuid);
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
				logger.error("Found a non-BasePart in a collider!!!");
				continue;
			}

			const touchingWith = (colliders.Parent as WorldRoot).GetPartsInPart(collider);
			if (touchingWith.size() === 0) continue;

			const targetPart = getTarget(collider);
			if (!targetPart) continue;

			for (const anotherCollider of touchingWith) {
				const anotherTargetPart = getTarget(anotherCollider);
				if (!anotherTargetPart) continue;

				makeJoints(targetPart, anotherTargetPart);
			}
		}
	}

	export function moveCollisions(plot: PlotModel, block: BlockModel, newpivot: CFrame) {
		const child = getPlotColliders(plot).FindFirstChild(BlockManager.manager.uuid.get(block)) as
			| CollidersModel
			| undefined;
		if (!child) throw "what";

		unweldFromOtherBlocks(block);
		child.PivotTo(newpivot);
		weld(plot, child);
	}

	export function makeJoints(part0: BasePart, part1: BasePart) {
		const weld = new Instance("WeldConstraint");

		weld.Part0 = part0;
		weld.Part1 = part1;
		weld.Name = "AutoWeld";

		weld.Parent = part0;
	}

	export function unweld(model: BlockModel): Set<BasePart> {
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

	export function unweldFromOtherBlocks(model: BlockModel): Set<BasePart> {
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
