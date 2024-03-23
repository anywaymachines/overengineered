import { Workspace } from "@rbxts/services";
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
		RemoteEvents.ImpactExplode.invoked.Connect((player, { parts }) => this.impactExplodeEvent(player, parts));
		RemoteEvents.Burn.invoked.Connect((_, parts) => this.burnEvent(parts));
	},

	impactExplodeEvent(player: Player | undefined, parts: Map<BasePart, number>) {
		parts.forEach((blastRadius, block) => {
			if (!BlockManager.isActiveBlockPart(block)) return;

			const closestParts = Workspace.GetPartBoundsInRadius(block.Position, blastRadius);
			this.impactBreakEvent(player, closestParts);
		});
	},

	impactBreakEvent(player: Player | undefined, parts: BasePart[]) {
		parts.forEach((part) => {
			if (!BlockManager.isActiveBlockPart(part)) return;

			ServerPartUtils.BreakJoints(part);

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
