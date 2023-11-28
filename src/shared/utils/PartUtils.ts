export default class PartUtils {
	static ghostModel(model: Model) {
		this.applyToAllParts(model, (part) => {
			part.CanCollide = false;
			part.CanQuery = false;
			part.CanTouch = false;
		});
	}

	static switchDescendantsTransparency(model: Instance, transparency: number) {
		this.applyToAllParts(model, (part) => {
			part.Transparency = transparency;
		});
	}

	static switchDescendantsAnchor(model: Instance, isAnchored: boolean) {
		this.applyToAllParts(model, (part) => {
			part.Anchored = isAnchored;
		});
	}

	static switchDescendantsMaterial(model: Instance, material: Enum.Material) {
		this.applyToAllParts(model, (part) => {
			if (part.GetAttribute("static_material") === true) return;
			part.Material = material;
		});
	}

	static switchDescendantsColor(model: Instance, color: Color3) {
		this.applyToAllParts(model, (part) => {
			if (part.GetAttribute("static_color") === true) return;
			part.Color = color;
		});
	}

	static applyToAllParts(model: Instance, callback: (part: BasePart) => void) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				callback(element);
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
