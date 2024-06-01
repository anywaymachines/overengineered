import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { SpreadingFireController } from "server/SpreadingFireController";
import { BlockManager } from "shared/building/BlockManager";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { EffectBase } from "shared/effects/EffectBase";
import { HostedService } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlayerDatabase } from "server/database/PlayerDatabase";

@injectable
export class UnreliableRemoteController extends HostedService {
	constructor(@inject players: PlayerDatabase) {
		super();

		// PhysicsService.RegisterCollisionGroup("Wreckage");
		// PhysicsService.CollisionGroupSetCollidable("Wreckage", "Wreckage", false);

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				ServerPartUtils.BreakJoints(part);
				// part.CollisionGroup = "Wreckage";

				// Play sounds
				RemoteEvents.Effects.ImpactSound.send(player ? [player] : "everyone", { part, index: undefined });
			});
		};

		const burnEvent = (parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				SpreadingFireController.burn(part);
			});
		};

		EffectBase.staticMustSendToPlayer = (player) =>
			players.get(player.UserId).settings?.graphics?.othersEffects ??
			PlayerConfigDefinition.graphics.config.othersEffects;

		this.event.subscribe(RemoteEvents.ImpactBreak.invoked, impactBreakEvent);
		this.event.subscribe(RemoteEvents.Burn.invoked, (_, parts) => burnEvent(parts));
	}
}
