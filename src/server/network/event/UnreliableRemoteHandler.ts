import { SpreadingFireController } from "server/SpreadingFireController";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { RemoteEvents } from "shared/RemoteEvents";
import { BlockManager } from "shared/building/BlockManager";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { EffectBase } from "shared/effects/EffectBase";

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
	PlayerDatabase.instance.get(player.UserId).settings?.others_gfx ?? PlayerConfigDefinition.others_gfx.config;

RemoteEvents.ImpactBreak.invoked.Connect(impactBreakEvent);
RemoteEvents.Burn.invoked.Connect((_, parts) => burnEvent(parts));

export namespace UnreliableRemoteHandler {
	/** Empty method just to trigger the import */
	export function initialize() {}
}
