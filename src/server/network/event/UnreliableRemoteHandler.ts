import SpreadingFireController from "server/SpreadingFireController";
import PlayerDatabase from "server/database/PlayerDatabase";
import ServerPartUtils from "server/plots/ServerPartUtils";
import RemoteEvents from "shared/RemoteEvents";
import BlockManager from "shared/building/BlockManager";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import EffectBase from "shared/effects/EffectBase";
import Effects from "shared/effects/Effects";

const UnreliableRemoteHandler = {
	init() {
		EffectBase.staticMustSendToPlayer = (player) =>
			PlayerDatabase.instance.get(tostring(player.UserId)).settings?.others_gfx ??
			PlayerConfigDefinition.others_gfx.config;

		RemoteEvents.ImpactBreak.invoked.Connect((player, part) => this.impactBreakEvent(player, part));
		RemoteEvents.ImpactExplode.invoked.Connect((player, { part, blastRadius }) =>
			this.impactExplodeEvent(player, part, blastRadius),
		);
		RemoteEvents.Burn.invoked.Connect((_, part) => this.burnEvent(part));
	},

	impactExplodeEvent(player: Player | undefined, block: BasePart, blastRadius: number) {
		if (!BlockManager.isActiveBlockPart(block)) return;

		const explosion = new Instance("Explosion");
		explosion.BlastPressure = 2000;
		explosion.BlastRadius = blastRadius;
		explosion.ExplosionType = Enum.ExplosionType.NoCraters;
		explosion.Visible = false;
		explosion.Position = block.Position;
		explosion.DestroyJointRadiusPercent = 0;
		explosion.Parent = block;
		explosion.Hit.Connect((part) => {
			if (math.random(1, 3) > 1) {
				this.impactBreakEvent(player, part);
			}
		});
	},

	impactBreakEvent(player: Player | undefined, part: BasePart) {
		if (!BlockManager.isActiveBlockPart(part)) return;

		ServerPartUtils.BreakJoints(part);

		// Play sounds
		Effects.ImpactSound.send(player ? [player] : "everyone", { part, index: undefined });
	},

	burnEvent(block: BasePart) {
		if (!BlockManager.isActiveBlockPart(block)) return;

		SpreadingFireController.burn(block);
	},
};
export default UnreliableRemoteHandler;
