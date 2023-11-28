export default class BuildingWelder {
	private static getClosestParts(model: Model): BasePart[] {
		const results: BasePart[] = [];
		const vectors = this.getVectors(model);
		const primaryPart = model.PrimaryPart as BasePart;
		const canCollide = primaryPart.CanCollide;

		if (!canCollide) {
			primaryPart.CanCollide = true;
		}

		for (let i = 0; i < vectors.size(); i++) {
			this.checkVectorAndAddParts(model, primaryPart, vectors[i], results);
		}

		if (!canCollide) {
			primaryPart.CanCollide = false;
		}

		return results;
	}

	private static getVectors(model: Model): Vector3[] {
		const size = model.GetExtentsSize();
		return [
			new Vector3(0, size.Y, 0),
			new Vector3(0, 0, size.Z),
			new Vector3(size.X, 0, 0),
			new Vector3(0, -size.Y, 0),
			new Vector3(0, 0, -size.Z),
			new Vector3(-size.X, 0, 0),
		];
	}

	private static checkVectorAndAddParts(
		model: Model,
		primaryPart: BasePart,
		vector: Vector3,
		results: BasePart[],
	): void {
		const worldSpaceMovement = model.GetPivot().PointToWorldSpace(vector).sub(model.GetPivot().Position);
		model.PivotTo(model.GetPivot().add(worldSpaceMovement));

		primaryPart.GetTouchingParts().forEach((basepart) => {
			if (
				basepart.Parent &&
				!basepart.IsDescendantOf(model) &&
				basepart.Parent.GetAttribute("id") !== undefined &&
				!results.includes(basepart)
			) {
				results.push(basepart);
			}
		});

		const returnWorldSpaceMovement = model
			.GetPivot()
			.PointToWorldSpace(vector.mul(-1))
			.sub(model.GetPivot().Position);
		model.PivotTo(model.GetPivot().add(returnWorldSpaceMovement));
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
			weld.Name = "AutoWeldConstraint";
		}
	}
}
