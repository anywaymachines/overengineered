import { Workspace } from "@rbxts/services";
import { LocalInstanceData } from "engine/shared/LocalInstanceData";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import { CustomDebrisService } from "shared/service/CustomDebrisService";
import { TagUtils } from "shared/utils/TagUtils";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { FireEffect } from "shared/effects/FireEffect";

const overlapParams = new OverlapParams();
overlapParams.CollisionGroup = "Blocks";

@injectable
export class SpreadingFireController {
	constructor(
		@inject private readonly fireEffect: FireEffect,
		@inject private readonly playersController: ServerPlayersController,
	) {}

	private isPartBurnable(part: BasePart) {
		if (
			!BlockManager.isActiveBlockPart(part) ||
			LocalInstanceData.HasLocalTag(part, "Burn") ||
			part.HasTag(TagUtils.allTags.FIREPROOF_MATERIAL) ||
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
		const darkness = math.random(0, 50);
		part.Color = Color3.fromRGB(darkness, darkness, darkness);

		const duration = math.random(15, 30);

		// Apply fire effect
		this.fireEffect.send(part, { part, duration });

		task.delay(duration, () => {
			if (!part.Parent) return;
			if (!part.CanSetNetworkOwnership()[0]) return;

			// Break joints with a chance
			if (math.random(1, 4) === 1) {
				const players = this.playersController.getPlayers().filter((p) => p !== part.GetNetworkOwner());
				CustomRemotes.physics.normalizeRootparts.send(players, { parts: [part] });
				ServerPartUtils.BreakJoints(part);
			}

			// Burn closest parts
			const closestParts = Workspace.GetPartBoundsInRadius(part.Position, 3.5, overlapParams);
			closestParts.forEach((part) => this.burn(part));
		});
	}
}
