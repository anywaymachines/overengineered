import PartUtils from "shared/utils/PartUtils";

export default class ServerPartUtils {
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

	static BreakJoints(part: BasePart) {
		const joints = part.GetJoints();
		joints.forEach((constraint) => {
			constraint.Destroy();
		});
	}
}
