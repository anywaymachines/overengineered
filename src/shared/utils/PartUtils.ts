export default class PartUtils {
	static ghostModel(model: Model) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.CanCollide = false;
				element.CanQuery = false;
				element.CanTouch = false;
			}
		});
	}

	static switchDescendantsAnchor(model: Instance, isAnchored: boolean) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.Anchored = isAnchored;
			}
		});
	}

	static switchDescendantsMaterial(model: Instance, material: Enum.Material) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.Material = material;
			}
		});
	}

	static switchDescendantsNetworkOwner(model: Instance, owner: Player) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.SetNetworkOwner(owner);
			}
		});
	}
}
