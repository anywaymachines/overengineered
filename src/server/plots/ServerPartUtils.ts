import PartUtils from "shared/utils/PartUtils";

/** Methods to edit block part information */
export default class ServerPartUtils {
	static switchDescendantsAnchor(model: Instance, isAnchored: boolean) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			part.Anchored = isAnchored;
		});
	}

	static switchDescendantsNetworkOwner(model: Instance, owner: Player | undefined) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			part.SetNetworkOwner(owner);
		});
	}
}
