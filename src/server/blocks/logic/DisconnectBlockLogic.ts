import { Workspace } from "@rbxts/services";
import { registerOnRemoteEvent2 } from "server/network/event/RemoteHandler";

export default class DisconnectBlockLogic {
	static init() {
		registerOnRemoteEvent2("Blocks", "DisconnectBlock", "Disconnect", (player, block) => {
			if (!block) {
				return;
			}

			if (!block.IsDescendantOf(Workspace)) {
				return;
			}

			if (block.PrimaryPart!.GetNetworkOwner() !== player) {
				player.Kick();
				return;
			}

			(block.FindFirstChild("Ejector") as Part | undefined)?.Destroy();
		});
	}
}
