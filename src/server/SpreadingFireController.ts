import { Players, Workspace } from "@rbxts/services";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { LocalInstanceData } from "shared/LocalInstanceData";
import { CustomRemotes } from "shared/Remotes";
import { CustomDebrisService } from "shared/service/CustomDebrisService";
import type { FireEffect } from "shared/effects/FireEffect";

const overlapParams = new OverlapParams();
overlapParams.CollisionGroup = "Blocks";

@injectable
export class SpreadingFireController {
	constructor(@inject private readonly fireEffect: FireEffect) {}

	private isPartBurnable(part: BasePart) {
		if (
			!BlockManager.isActiveBlockPart(part) ||
			LocalInstanceData.HasLocalTag(part, "Burn") ||
			part.HasTag("Fireproof") ||
			(math.random(1, 8) !== 1 && part.Position.Y < 1 + GameDefinitions.HEIGHT_OFFSET)
		) {
			return false;
		}

		return true;
	}

	burn(part: BasePart) {
		if (!this.isPartBurnable(part)) {
			return;
		}

		LocalInstanceData.AddLocalTag(part, "Burn");
		if (CustomDebrisService.exists(part)) CustomDebrisService.remove(part);

		// Apply color
		const rand_rgb = math.random(0, 50);
		const color = Color3.fromRGB(rand_rgb, rand_rgb, rand_rgb);
		part.Color = color;

		const duration = math.random(15, 30);

		// Apply fire effect
		this.fireEffect.send(part, { part, duration });

		task.delay(duration, () => {
			if (!part.Parent) return;

			// Break joints with a chance
			if (math.random(1, 4) === 1) {
				const players = Players.GetPlayers().filter((p) => p !== part.GetNetworkOwner());
				CustomRemotes.physics.normalizeRootparts.send(players, { parts: [part] });
				ServerPartUtils.BreakJoints(part);
			}

			// Burn closest parts
			const closestParts = Workspace.GetPartBoundsInRadius(part.Position, 3.5, overlapParams);
			closestParts.forEach((part) => this.burn(part));
		});
	}
}
