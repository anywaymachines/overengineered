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

	static readonly removeQueue = new Set<Instance>();

	static BreakJoints(part: BasePart) {
		PartUtils.BreakJoints(part);

		if (part.IsA("VehicleSeat")) return;

		if (game.PrivateServerOwnerId === 0 && !this.removeQueue.has(part)) {
			const time = math.random(20, 60);
			game.GetService("Debris").AddItem(part, time);

			this.removeQueue.add(part);
			task.delay(time, () => {
				this.removeQueue.delete(part);
			});
		}
	}
}
