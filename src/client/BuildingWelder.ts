import { Workspace } from "@rbxts/services";

export default class BuildingWelder {
	static getClosestParts(model: Model): BasePart[] {
		const results: BasePart[] = [];

		const checker = model.Clone();
		checker.Parent = Workspace;

		// Vectors to check for joints
		const vectors: Vector3[] = [
			new Vector3(0, 1, 0),
			new Vector3(0, 0, 1),
			new Vector3(1, 0, 0),
			new Vector3(0, -1, 0),
			new Vector3(0, 0, -1),
			new Vector3(-1, 0, 0),
		];

		// Checking all vectors
		for (let i = 0; i < vectors.size(); i++) {
			const worldSpaceMovement = model.GetPivot().PointToWorldSpace(vectors[i]).sub(model.GetPivot().Position);
			model.PivotTo(model.GetPivot().add(worldSpaceMovement));

			(model.PrimaryPart as BasePart).GetTouchingParts().forEach((basepart) => {
				if (
					basepart.Parent &&
					basepart.Parent.GetAttribute("isBlock") === true &&
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

		checker.Destroy();

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
