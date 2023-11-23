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

	static switchDescendantsTransparency(model: Instance, transparency: number) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.Transparency = transparency;
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

	static switchDescendantsColor(model: Instance, color: Color3) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.Color = color;
			}
		});
	}

	static switchDescendantsNetworkOwner(model: Instance, owner: Player) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			pcall(() => {
				(element as BasePart).SetNetworkOwner(owner);
			});
		});
	}
}
