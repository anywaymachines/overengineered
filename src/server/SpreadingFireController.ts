import { Workspace } from "@rbxts/services";
import LocalInstanceData from "shared/LocalInstanceData";
import BlockManager from "shared/building/BlockManager";
import Effects from "shared/effects/Effects";
import ServerPartUtils from "./plots/ServerPartUtils";

const overlapParams = new OverlapParams();
overlapParams.CollisionGroup = "Blocks";
export default class SpreadingFireController {
	private static isPartBurnable(part: BasePart) {
		if (
			!BlockManager.isActiveBlockPart(part) ||
			LocalInstanceData.HasLocalTag(part, "Burn") ||
			(math.random(1, 8) !== 1 && part.Position.Y < 1)
		) {
			return false;
		}

		return true;
	}

	static burn(part: BasePart) {
		if (!this.isPartBurnable(part)) {
			return;
		}

		LocalInstanceData.AddLocalTag(part, "Burn");

		// Apply color
		const rand_rgb = math.random(0, 50);
		const color = Color3.fromRGB(rand_rgb, rand_rgb, rand_rgb);
		part.Color = color;

		const duration = math.random(15, 30);

		// Apply fire effect
		Effects.Fire.sendToNetworkOwnerOrEveryone(part, { part, duration });

		task.delay(duration, () => {
			if (!part.Parent) return;

			// Break joints with a chance
			if (math.random(1, 4) === 1) {
				ServerPartUtils.BreakJoints(part);
			}

			// Burn closest parts
			const closestParts = Workspace.GetPartBoundsInRadius(part.Position, 3.5, overlapParams);
			closestParts.forEach((part) => {
				this.burn(part);
			});
		});
	}
}
