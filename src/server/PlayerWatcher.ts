import { Players } from "@rbxts/services";

export namespace PlayerWatcher {
	export const errDestroyed: ErrorResponse = { success: false, message: "PLAYER DESTROYED" };

	export function onJoin(func: (player: Player) => void) {
		return Players.PlayerAdded.Connect(func);
	}
	export function onQuit(func: (player: Player) => void) {
		return Players.PlayerRemoving.Connect(func);
	}
}
