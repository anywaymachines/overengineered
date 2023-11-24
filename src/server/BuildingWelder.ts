import { Workspace } from "@rbxts/services";
import Remotes from "shared/Remotes";

export default class BuildingWelder {
	static getClosestParts(model: Model): BasePart[] {
		const results: BasePart[] = [];

		// Vectors to check for joints
		const size = model.GetExtentsSize();
		const vectors: Vector3[] = [
			new Vector3(0, size.Y, 0),
			new Vector3(0, 0, size.Z),
			new Vector3(size.X, 0, 0),
			new Vector3(0, -size.Y, 0),
			new Vector3(0, 0, -size.Z),
			new Vector3(-size.X, 0, 0),
		];

		// Checking all vectors
		for (let i = 0; i < vectors.size(); i++) {
			const worldSpaceMovement = model.GetPivot().PointToWorldSpace(vectors[i]).sub(model.GetPivot().Position);
			model.PivotTo(model.GetPivot().add(worldSpaceMovement));

			(model.PrimaryPart as BasePart).GetTouchingParts().forEach((basepart) => {
				if (
					basepart.Parent &&
					!basepart.IsDescendantOf(model) &&
					basepart.Parent.GetAttribute("id") !== undefined &&
					!results.includes(basepart) &&
					!basepart.IsDescendantOf(model)
				) {
					results.push(basepart);
				}
			});

			const returnWorldSpaceMovement = model
				.GetPivot()
				.PointToWorldSpace(vectors[i].mul(-1))
				.sub(model.GetPivot().Position);
			model.PivotTo(model.GetPivot().add(returnWorldSpaceMovement));
		}

		return results;
	}

	static makeJoints(model: Model): void {
		const part0 = model.PrimaryPart as BasePart;

		const closestParts = this.getClosestParts(model);
		for (let i = 0; i < closestParts.size(); i++) {
			const part1 = closestParts[i];

			const weld = new Instance("WeldConstraint");
			weld.Part0 = part0;
			weld.Part1 = part1;
			weld.Parent = part0;
		}
	}
}
