import { Workspace } from "@rbxts/services";

export default class BuildingWelder {
	static getSides(part: BasePart): readonly (readonly [origin: Vector3, normal: Vector3])[] {
		const get = (sides: readonly Enum.NormalId[]) => {
			const ret: (readonly [origin: Vector3, normal: Vector3])[] = [];
			const size = part.Size;

			for (const side of sides) {
				const diff = Vector3.FromNormalId(side);

				const offset = 0.1;
				const push = (x: number, y: number, z: number) => {
					ret.push([
						part.CFrame.PointToWorldSpace(new Vector3(x, y, z).sub(part.Size.div(2))),
						part.CFrame.PointToWorldSpace(diff.mul(offset + 0.01)).sub(part.Position),
					] as const);
				};

				if (diff.X !== 0) {
					const my = math.min(size.Y / 2, 1);
					const mz = math.min(size.Z / 2, 1);

					for (let y = my; y < size.Y; y += 2) {
						for (let z = mz; z < size.Z; z += 2) {
							push(diff.X > 0 ? size.X : 0, y, z);

							push(diff.X > 0 ? size.X - offset : offset, y + my * 0.9, z + mz * 0.9);
							push(diff.X > 0 ? size.X - offset : offset, y + my * 0.9, z - mz * 0.9);
							push(diff.X > 0 ? size.X - offset : offset, y - my * 0.9, z + mz * 0.9);
							push(diff.X > 0 ? size.X - offset : offset, y - my * 0.9, z - mz * 0.9);
						}
					}
				} else if (diff.Y !== 0) {
					const mx = math.min(size.X / 2, 1);
					const mz = math.min(size.Z / 2, 1);

					for (let x = mx; x < size.X; x += 2) {
						for (let z = mz; z < size.Z; z += 2) {
							push(x, diff.Y > 0 ? size.Y : 0, z);

							push(x + mx * 0.9, diff.Y > 0 ? size.Y - offset : offset, z + mz * 0.9);
							push(x + mx * 0.9, diff.Y > 0 ? size.Y - offset : offset, z - mz * 0.9);
							push(x - mx * 0.9, diff.Y > 0 ? size.Y - offset : offset, z + mz * 0.9);
							push(x - mx * 0.9, diff.Y > 0 ? size.Y - offset : offset, z - mz * 0.9);
						}
					}
				} else if (diff.Z !== 0) {
					const mx = math.min(size.X / 2, 1);
					const my = math.min(size.Y / 2, 1);

					for (let x = mx; x < size.X; x += 2) {
						for (let y = my; y < size.Y; y += 2) {
							push(x, y, diff.Z > 0 ? size.Z : 0);

							push(x + mx * 0.9, y + my * 0.9, diff.Z > 0 ? size.Z - offset : offset);
							push(x + mx * 0.9, y - my * 0.9, diff.Z > 0 ? size.Z - offset : offset);
							push(x - mx * 0.9, y + my * 0.9, diff.Z > 0 ? size.Z - offset : offset);
							push(x - mx * 0.9, y - my * 0.9, diff.Z > 0 ? size.Z - offset : offset);
						}
					}
				}
			}

			return ret;
		};

		if (part.IsA("Part")) {
			if (part.Shape === Enum.PartType.CornerWedge) {
				return get([Enum.NormalId.Right, Enum.NormalId.Bottom, Enum.NormalId.Front]);
			} else if (part.Shape === Enum.PartType.Wedge) {
				return get([Enum.NormalId.Left, Enum.NormalId.Right, Enum.NormalId.Bottom, Enum.NormalId.Back]);
			}
		}

		return get([
			Enum.NormalId.Right,
			Enum.NormalId.Left,

			Enum.NormalId.Top,
			Enum.NormalId.Bottom,

			Enum.NormalId.Back,
			Enum.NormalId.Front,
		]);
	}

	static getClosestParts(part: BasePart) {
		const raycastParams = new RaycastParams();
		raycastParams.CollisionGroup = "BlockWeld";

		const ret = new Set<BasePart>();
		for (const [origin, normal] of this.getSides(part)) {
			const raycastResult = Workspace.Raycast(origin, normal, raycastParams);
			if (!raycastResult) continue;

			ret.add(raycastResult.Instance);
		}

		return ret;
	}

	static makeJoints(part0: BasePart, part1: BasePart) {
		const weld = new Instance("WeldConstraint");

		weld.Part0 = part0;
		weld.Part1 = part1;
		weld.Name = "AutoWeld";

		weld.Parent = part0;
	}

	static unweld(model: Model): void {
		const modelParts = model.GetChildren().filter((value) => value.IsA("BasePart") && value.CanCollide);
		for (let i = 0; i < modelParts.size(); i++) {
			const modelPart = modelParts[i] as BasePart;
			const welds = modelPart.GetJoints();
			welds.forEach((element) => {
				element.Destroy();
			});
		}
	}

	static weld(model: Model): void {
		const modelParts = model.GetChildren().filter((value) => value.IsA("BasePart") && value.CanCollide);
		for (let i = 0; i < modelParts.size(); i++) {
			const modelPart = modelParts[i] as BasePart;
			const closestParts = this.getClosestParts(modelPart);

			for (const closestPart of closestParts) {
				if (closestPart.IsDescendantOf(model)) continue;

				this.makeJoints(modelPart, closestPart);
			}
		}
	}
}
