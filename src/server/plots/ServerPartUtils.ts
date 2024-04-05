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
			part.SetNetworkOwner(owner);
		});
	}

	const removeQueue = new Set<Instance>();
	export function BreakJoints(part: BasePart) {
		PartUtils.BreakJoints(part);

		if (part.IsA("VehicleSeat")) return;

		if (game.PrivateServerOwnerId === 0 && !removeQueue.has(part)) {
			const time = math.random(20, 60);
			game.GetService("Debris").AddItem(part, time);

			removeQueue.add(part);
			task.delay(time, () => {
				removeQueue.delete(part);
			});
		}
	}
}
