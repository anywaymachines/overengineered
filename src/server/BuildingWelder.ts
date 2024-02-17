import { ReplicatedStorage } from "@rbxts/services";
import { Element } from "shared/Element";

export default class BuildingWelder {
	private static readonly weldFolderName = "WeldRegions";

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
					const size = part.Size;

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

		for (const block of blocks) {
			if (block.FindFirstChild(this.weldFolderName)) {
				const colliders = block
					.FindFirstChild(this.weldFolderName)
					?.GetChildren() as unknown as readonly BasePart[];

				for (const collider of colliders) {
					setColliderProperties(collider);
				}

				continue;
			}

			const regions = createAutomatic(block);
			if (!regions || regions.size() === 0) continue;

			const collision = Element.create("Folder", { Name: this.weldFolderName });
			for (const region of regions) {
				const part = Element.create("Part", { Parent: collision, Size: region.Size });
				setColliderProperties(part);
				part.PivotTo(region.CFrame);
			}

			print(`[BLOCKINIT] Adding ${regions.size()} automatic regions to ${block.Name}`);
			collision.Parent = block;
		}
	}

	static getClosestParts(block: BlockModel): ReadonlyMap<BasePart, ReadonlySet<BasePart>> {
		if (!block.FindFirstChild(this.weldFolderName)) return new Map();

		const getTarget = (collider: BasePart): BasePart => {
			const targetstr = collider.GetAttribute("target") as string | undefined;
			if (targetstr !== undefined) {
				return collider.Parent!.Parent!.FindFirstChild(targetstr) as BasePart;
			}

			return (
				(collider.Parent!.Parent! as Model).FindFirstChildWhichIsA("BasePart") ??
				(collider.Parent!.Parent! as Model).PrimaryPart!
			);
		};

		const weldedWith = new Map<BasePart, Set<BasePart>>();
		const areWeldedTogether = (
			part: BasePart,
			anotherPart: BasePart,
			allWelds: Map<BasePart, Set<BasePart>>,
		): boolean => {
			return (allWelds.get(part)?.has(anotherPart) || allWelds.get(anotherPart)?.has(part)) ?? false;
		};

		const colliders = block.WaitForChild(this.weldFolderName).GetChildren() as unknown as readonly BasePart[];
		for (const collider of colliders) {
			const touchingWith = collider.GetTouchingParts().filter((p) => p.Parent?.Name === this.weldFolderName);
			if (touchingWith.size() === 0) continue;

			const targetPart = getTarget(collider);
			if (!weldedWith.has(targetPart)) {
				weldedWith.set(targetPart, new Set<BasePart>());
			}

			for (const anotherCollider of touchingWith) {
				const anotherTargetPart = getTarget(anotherCollider);
				if (!areWeldedTogether(targetPart, anotherTargetPart, weldedWith)) {
					weldedWith.get(targetPart)!.add(anotherTargetPart);
				}
			}
		}

		return weldedWith;
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

	static weld(model: BlockModel): Set<BasePart> {
		const newJoints = new Set<BasePart>();
		const closestParts = this.getClosestParts(model);

		for (const [left, rights] of closestParts) {
			for (const right of rights) {
				if (right.IsDescendantOf(model)) continue;

				this.makeJoints(left, right);
				newJoints.add(left);
				newJoints.add(right);
			}
		}

		return newJoints;
	}
}
