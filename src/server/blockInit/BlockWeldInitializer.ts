import { Workspace, RunService } from "@rbxts/services";
import type { AutoWeldColliderBlockShape } from "shared/BlockDataRegistry";

export namespace BlockWeldInitializer {
	function region(center: Vector3, size: Vector3) {
		return new Region3(center.sub(size.div(2)), center.add(size.div(2)));
	}
	function setColliderProperties(collider: BasePart) {
		collider.Transparency = 1;
		collider.Material = Enum.Material.Plastic;
		collider.Anchored = true;
		collider.Massless = true;
		collider.CollisionGroup = "BlockCollider";
		collider.CanCollide = true;
		collider.CanTouch = false;
		collider.EnableFluidForces = false;
	}

	function createAutomaticWelds(
		id: BlockId,
		model: BlockModel,
		parent: Model,
		autoWeldShape: AutoWeldColliderBlockShape,
	): void {
		const createRegions = (): readonly Region3[] | undefined => {
			const offset = 0.2;

			if (
				(model.GetChildren().size() === 1 &&
					model.PrimaryPart!.IsA("Part") &&
					model.PrimaryPart!.Shape === Enum.PartType.Block) ||
				autoWeldShape === "cube"
			) {
				const part = model.FindFirstChildWhichIsA("Part");
				if (!part) return;

				if (part.Shape === Enum.PartType.Block) {
					const blockpos = part.Position;
					const size = (
						model.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[]
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

		const regions = createRegions();
		if (!regions || regions.size() === 0) return;

		const parts: BasePart[] = [];
		for (const region of regions) {
			const part = new Instance("Part");
			part.PivotTo(region.CFrame);
			part.Size = region.Size;
			part.Parent = Workspace;

			parts.push(part);
		}

		const union = parts[0].UnionAsync(
			parts.filter((_, i) => i !== 0),
			Enum.CollisionFidelity.PreciseConvexDecomposition,
		);

		for (const part of parts) {
			part.Destroy();
		}

		setColliderProperties(union);
		union.Parent = parent;

		$log(`Adding automatic weld region to ${model.Name}`);
	}
	function tryCreateWeldsFromFolder(block: BlockModel, parent: Model): boolean {
		const weldFolderName = "WeldRegions";

		const folder = block.FindFirstChild(weldFolderName);
		if (!folder) return false;

		const colliders = folder.GetChildren() as unknown as readonly BasePart[];
		if (colliders.size() === 0) return false;

		for (const [key, group] of colliders.groupBy((g) => (g.GetAttribute("target") as string | undefined) ?? "")) {
			if (group.size() < 2) {
				for (const collider of group) {
					const newcollider = collider.Clone();
					setColliderProperties(newcollider);
					newcollider.Parent = parent;
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

			union.Parent = parent;

			for (const collider of group) {
				collider.Destroy();
			}
		}

		block.FindFirstChild(weldFolderName)?.Destroy();
		return true;
	}

	function createBlockWeldColliders(
		id: BlockId,
		block: BlockModel,
		autoWeldShape: AutoWeldColliderBlockShape,
	): Model {
		const weldParent = new Instance("Model");
		weldParent.WorldPivot = block.GetPivot();

		if (tryCreateWeldsFromFolder(block, weldParent)) {
			return weldParent;
		}

		createAutomaticWelds(id, block, weldParent, autoWeldShape);
		return weldParent;
	}

	type RegistryBlock = {
		readonly id: BlockId;
		readonly model: BlockModel;
		weldColliders?: Model;
	};
	export function initialize<T extends RegistryBlock>(
		block: T,
		autoWeldShape: AutoWeldColliderBlockShape,
	): asserts block is T & { weldColliders: RegistryBlock["weldColliders"] & defined } {
		block.weldColliders = createBlockWeldColliders(block.id, block.model, autoWeldShape);
	}
}
