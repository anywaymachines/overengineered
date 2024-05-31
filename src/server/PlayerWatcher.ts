import { Players } from "@rbxts/services";
import type { ComponentEvents } from "shared/component/ComponentEvents";

export namespace PlayerWatcher {
	export const errDestroyed: ErrorResponse = { success: false, message: "PLAYER DESTROYED" };

	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onJoin(func: (player: Player) => void) {
		const sub = Players.PlayerAdded.Connect(func);
		for (const player of Players.GetPlayers()) {
			func(player);
		}

		return sub;
	}
	/** Susbcribes on a player join event, and immediately runs on for existing player */
	export function onJoinEvt(event: Pick<ComponentEvents, "subscribe">, func: (player: Player) => void) {
		event.subscribe(Players.PlayerAdded, func);
		for (const player of Players.GetPlayers()) {
			func(player);
		}
	}

	/** Susbcribes on a player quit event */
	export function onQuit(func: (player: Player) => void) {
		return Players.PlayerRemoving.Connect(func);
	}
}
