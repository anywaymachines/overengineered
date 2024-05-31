import { Players } from "@rbxts/services";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";

export namespace PlayerWatcher {
	export const errDestroyed: ErrorResponse = { success: false, message: "PLAYER DESTROYED" };

	export const players = new ObservableCollectionSet<Player>();
	onJoin((player) => players.add(player));
	onQuit((player) => players.remove(player));

	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onJoin(func: (player: Player) => void) {
		const sub = Players.PlayerAdded.Connect(func);
		for (const player of Players.GetPlayers()) {
			func(player);
		}

		return sub;
	}

	/** Susbcribes on a player quit event */
	export function onQuit(func: (player: Player) => void) {
		return Players.PlayerRemoving.Connect(func);
	}
}
