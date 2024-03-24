import { PhysicsService } from "@rbxts/services";
import SpreadingFireController from "server/SpreadingFireController";
import PlayerDatabase from "server/database/PlayerDatabase";
import ServerPartUtils from "server/plots/ServerPartUtils";
import RemoteEvents from "shared/RemoteEvents";
import BlockManager from "shared/building/BlockManager";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import EffectBase from "shared/effects/EffectBase";
import Effects from "shared/effects/Effects";

PhysicsService.RegisterCollisionGroup("Wreckage");
PhysicsService.CollisionGroupSetCollidable("Wreckage", "Wreckage", false);

const UnreliableRemoteHandler = {
	init() {
		EffectBase.staticMustSendToPlayer = (player) =>
			PlayerDatabase.instance.get(tostring(player.UserId)).settings?.others_gfx ??
			PlayerConfigDefinition.others_gfx.config;

		RemoteEvents.ImpactBreak.invoked.Connect((player, part) => this.impactBreakEvent(player, part));
		RemoteEvents.ImpactExplode.invoked.Connect((player, parts) => this.impactExplodeEvent(player, parts));
		RemoteEvents.Burn.invoked.Connect((_, parts) => this.burnEvent(parts));
	},

	// TODO: Optimize @Maks_gaming
	impactExplodeEvent(player: Player | undefined, parts: { part: BasePart; blastRadius: number }[]) {
		parts.forEach((part) => {
			const explosion = new Instance("Explosion");
			explosion.BlastPressure = 2000;
			explosion.BlastRadius = part.blastRadius;
			explosion.ExplosionType = Enum.ExplosionType.NoCraters;
			explosion.Visible = false;
			explosion.Position = part.part.Position;
			explosion.DestroyJointRadiusPercent = 0;
			explosion.Parent = part.part;
			explosion.Hit.Connect((part) => {
				if (math.random(1, 3) > 1) {
					this.impactBreakEvent(player, [part]);
				}
			});
		});
	},

	impactBreakEvent(player: Player | undefined, parts: BasePart[]) {
		parts.forEach((part) => {
			if (!BlockManager.isActiveBlockPart(part)) return;

			ServerPartUtils.BreakJoints(part);
			part.CollisionGroup = "Wreckage";

			// Play sounds
			Effects.ImpactSound.send(player ? [player] : "everyone", { part, index: undefined });
		});
	},

	burnEvent(parts: BasePart[]) {
		parts.forEach((part) => {
			if (!BlockManager.isActiveBlockPart(part)) return;

			SpreadingFireController.burn(part);
		});
	},
};
export default UnreliableRemoteHandler;
