import { CustomDebrisService } from "shared/service/CustomDebrisService";
import { PartUtils } from "shared/utils/PartUtils";

/** Methods to edit block part information */
export namespace ServerPartUtils {
	export function switchDescendantsAnchor(model: Instance, isAnchored: boolean) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			part.Anchored = isAnchored;
		});
	}

	export function switchDescendantsNetworkOwner(model: Instance, owner: Player | undefined) {
		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (!part.CanSetNetworkOwnership()[0]) return;
			part.SetNetworkOwner(owner);
		});
	}

	export function BreakJoints(part: BasePart) {
		PartUtils.BreakJoints(part);

		if (part.IsA("VehicleSeat")) return;

		CustomDebrisService.set(part, math.random(20, 60));
	}
}
