import { Players } from "@rbxts/services";
import { CustomRemotes } from "shared/Remotes";

export namespace ServerPlayers {
	const loadedPlayers: Set<Player> = new Set();

	CustomRemotes.player.loaded.invoked.Connect((plr) => {
		loadedPlayers.add(plr);
	});

	Players.PlayerRemoving.Connect((plr) => {
		if (loadedPlayers.has(plr)) loadedPlayers.delete(plr);
	});

	export function GetLoadedPlayers() {
		return [...loadedPlayers];
	}
}
