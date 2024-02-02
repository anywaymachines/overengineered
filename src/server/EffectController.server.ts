import { Players } from "@rbxts/services";
import PlayerDatabase from "server/PlayerDatabase";
import BlockManager from "shared/building/BlockManager";
import GameDefinitions from "shared/data/GameDefinitions";
import Effects from "shared/effects/Effects";
import { EffectsInvoker } from "shared/effects/EffectsInvoker";
import Objects from "shared/fixes/objects";

// TODO: Move away
const isGFXEnabledForPlayer = (player: Player): boolean => {
	return (
		PlayerDatabase.instance.get(tostring(player.UserId)).settings?.others_gfx ??
		GameDefinitions.PLAYER_SETTINGS_DEFINITION.others_gfx.default
	);
};

for (const [_, effect] of Objects.pairs(Effects)) {
	effect.event.OnServerEvent.Connect((player, part, arg) => redirect(player, part, false, arg));

	const redirect = <T>(player: Player, part: BasePart, share: boolean, arg: T) => {
		if (!BlockManager.isActiveBlockPart(part)) {
			return;
		}
		if (part.GetNetworkOwner() !== player) {
			return;
		}

		Players.GetPlayers().forEach((plr) => {
			if (player === plr) return;

			if (isGFXEnabledForPlayer(plr)) {
				effect.event.FireClient(plr, part, arg as never);
			}
		});
	};
}

EffectsInvoker.initialize((part, arg, forcePlayer, event) => {
	Players.GetPlayers().forEach((plr) => {
		if (forcePlayer === "everyone" || forcePlayer === plr || isGFXEnabledForPlayer(plr)) {
			event.FireClient(plr, part, arg);
		}
	});
});
