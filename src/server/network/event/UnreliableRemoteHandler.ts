import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { HostedService } from "shared/GameHost";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SpreadingFireController } from "server/SpreadingFireController";
import type { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";

@injectable
export class UnreliableRemoteController extends HostedService {
	constructor(
		@inject players: PlayerDatabase,
		@inject impactSoundEffect: ImpactSoundEffect,
		@inject spreadingFire: SpreadingFireController,
	) {
		super();

		// PhysicsService.RegisterCollisionGroup("Wreckage");
		// PhysicsService.CollisionGroupSetCollidable("Wreckage", "Wreckage", false);

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				ServerPartUtils.BreakJoints(part);
				// part.CollisionGroup = "Wreckage";

				// Play sounds
				impactSoundEffect.send(part, { part, index: undefined });
			});
		};

		const burnEvent = (parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				spreadingFire.burn(part);
			});
		};

		this.event.subscribe(RemoteEvents.ImpactBreak.invoked, impactBreakEvent);
		this.event.subscribe(RemoteEvents.Burn.invoked, (_, parts) => burnEvent(parts));
	}
}
