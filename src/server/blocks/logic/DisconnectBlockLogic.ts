import { registerOnRemoteEvent2 } from "server/network/event/RemoteHandler";

export default class DisconnectBlockLogic {
	static init() {
		registerOnRemoteEvent2("Blocks", "DisconnectBlock", "Disconnect", (player, block) => {
			block.FindFirstChild("Ejector")?.Destroy();
		});
	}
}
