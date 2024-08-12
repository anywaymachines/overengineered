import { Players } from "@rbxts/services";
import { Signal } from "shared/event/Signal";
import { CustomRemotes } from "shared/Remotes";

export namespace ServerPlayers {
	export const PlayerLoaded = new Signal<(player: Player) => void>();

	const loadedPlayers: Set<Player> = new Set();

	CustomRemotes.player.loaded.invoked.Connect((plr) => {
		loadedPlayers.add(plr);
		PlayerLoaded.Fire(plr);
	});

	Players.PlayerRemoving.Connect((plr) => {
		if (loadedPlayers.has(plr)) loadedPlayers.delete(plr);
	});

	export function GetLoadedPlayers() {
		return [...loadedPlayers];
	}

	export function IsPlayerLoaded(player: Player) {
		return loadedPlayers.has(player);
	}
}
