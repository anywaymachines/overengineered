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

	static setAnchorForModel(model: Model, isAnchored: boolean) {
		const children = model.GetDescendants();
		children.forEach((element) => {
			if (element.IsA("BasePart")) {
				element.Anchored = isAnchored;
			}
		});
	}
}
