import PartUtils from "shared/utils/PartUtils";

export default class ServerPartUtils {
	static switchDescendantsTransparency(model: Instance, transparency: number) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (part.GetAttribute("static_material") === true) return;
			if (part.Transparency === 1) return;
			part.Transparency = transparency;
		});
	}

	static switchDescendantsAnchor(model: Instance, isAnchored: boolean) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			part.Anchored = isAnchored;
		});
	}

	static switchDescendantsNetworkOwner(model: Instance, owner: Player) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			part.SetNetworkOwner(owner);
		});
	}
}
