import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { Element } from "shared/Element";
import Arrays from "shared/fixes/Arrays";

export default class BuildingWelder {
	private static readonly weldFolderName = "WeldRegions";
	private static readonly OverlapParams = new OverlapParams();

	static {
		this.OverlapParams.CollisionGroup = "BlockCollider";
	}

	static removeWeldCollisions(block: BlockModel) {
		block.FindFirstChild(this.weldFolderName)?.Destroy();
	}

	static initialize() {
		const getBlocks = (parent: Instance): readonly BlockModel[] => {
			const ret: BlockModel[] = [];
			for (const child of parent.GetChildren()) {
				if (child.IsA("Folder")) {
					for (const block of getBlocks(child)) {
						ret.push(block);
					}
				} else if (child.IsA("Model")) {
					ret.push(child as BlockModel);
				}
			}

			return ret;
		};

		BuildingWelder.initPartBlockCollisions(
			getBlocks(ReplicatedStorage.WaitForChild("Assets").WaitForChild("Placeable")),
		);
	}

	private static initPartBlockCollisions(blocks: readonly BlockModel[]) {
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

		const useUnions = true;
		const unionCache: [Vector3, UnionOperation][] = [];

		for (const block of blocks) {
			if (block.FindFirstChild(this.weldFolderName)) {
				const colliders = block
					.FindFirstChild(this.weldFolderName)
					?.GetChildren() as unknown as readonly BasePart[];
				if (colliders.size() === 0) continue;

				if (useUnions) {
					for (const [key, group] of Arrays.groupBy(
						colliders,
						(g) => (g.GetAttribute("target") as string | undefined) ?? "",
					)) {
						if (group.size() < 2) {
							for (const collider of group) {
								setColliderProperties(collider);
							}
							continue;
						}

						const union = group[0].UnionAsync(
							group.filter((_, i) => i !== 0),
							Enum.CollisionFidelity.PreciseConvexDecomposition,
						);
						setColliderProperties(union);
						if (key !== "") {
							union.SetAttribute("target", key);
						}

						union.Parent = group[0].Parent;

						for (const collider of group) {
							collider.Destroy();
						}
					}
				} else {
					for (const collider of colliders) {
						setColliderProperties(collider);
					}
				}

				continue;
			}

			if (!useUnions) {
				const regions = createAutomatic(block);
				if (!regions || regions.size() === 0) continue;
				const collision = Element.create("Folder", { Name: this.weldFolderName });

				for (const region of regions) {
					const part = Element.create("Part", { Parent: collision, Size: region.Size });
					part.PivotTo(region.CFrame);
					setColliderProperties(part);
				}

				collision.Parent = block;
			} else {
				const blocksize = (
					block.GetChildren().filter((c) => c.IsA("BasePart")) as unknown as readonly BasePart[]
				)
					.map((c) => c.Size)
					.reduce((acc, val) => (acc.Magnitude > val.Magnitude ? acc : val), Vector3.zero);

				let union = unionCache.find(([size]) => size === blocksize)?.[1];
				if (union) {
					union = union.Clone();
					union.PivotTo(block.GetPivot());

					const collision = Element.create("Folder", { Name: this.weldFolderName });
					union.Parent = collision;
					collision.Parent = block;
				} else {
					const regions = createAutomatic(block);
					if (!regions || regions.size() === 0) continue;
					const collision = Element.create("Folder", { Name: this.weldFolderName });

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
					union.Parent = collision;
					collision.Parent = block;
				}
			}

			print(`[BLOCKINIT] Adding automatic region to ${block.Name}`);
		}

		print("[BLOCKINIT] Block welding initialized");
	}

	static weld(block: BlockModel) {
		if (!block.FindFirstChild(this.weldFolderName)) return;

		const getTarget = (collider: BasePart): BasePart | undefined => {
			let part: BasePart | undefined;

			const targetstr = collider.GetAttribute("target") as string | undefined;
			if (targetstr !== undefined) {
				part = collider.Parent!.Parent!.FindFirstChild(targetstr) as BasePart | undefined;
			}

			return (
				part ??
				((collider.Parent!.Parent! as Model)
					.GetChildren()
					.find((c) => c.Name.lower() !== "colbox" && c.IsA("BasePart")) as BasePart | undefined) ??
				(collider.Parent!.Parent! as Model).PrimaryPart
			);
		};

		const colliders = block.WaitForChild(this.weldFolderName).GetChildren() as unknown as readonly BasePart[];
		for (const collider of colliders) {
			const touchingWith = Workspace.GetPartsInPart(collider, this.OverlapParams);
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
