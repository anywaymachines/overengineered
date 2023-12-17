import { registerOnRemoteEvent2 } from "server/network/event/RemoteHandler";

export default class DisconnectBlockLogic {
	static init() {
		registerOnRemoteEvent2("Blocks", "DisconnectBlock", "Disconnect", (player, block) => {
			// TODO: SECURITY
			block.FindFirstChild("Ejector")?.Destroy();
		});
	}
}
