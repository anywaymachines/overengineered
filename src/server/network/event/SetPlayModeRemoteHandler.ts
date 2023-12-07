import PlayModeController from "server/modes/PlayModeController";
import { registerOnRemoteFunction } from "./RemoteHandler";

export default class SetPlayModeRemoteHandler {
	static init() {
		registerOnRemoteFunction("Ride", "SetPlayMode", (player, mode) => {
			return PlayModeController.changeModeForPlayer(player, mode);
		});
	}
}
