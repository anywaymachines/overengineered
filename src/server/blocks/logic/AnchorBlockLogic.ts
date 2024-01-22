import { Workspace } from "@rbxts/services";
import { registerOnRemoteEvent2 } from "server/network/event/RemoteHandler";
import ServerPartUtils from "server/plots/ServerPartUtils";

export default class AnchorBlockLogic {
	static init() {
		registerOnRemoteEvent2("Blocks", "AnchorBlock", "Anchor", (player, block) => {
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

			ServerPartUtils.switchDescendantsAnchor(block, true);
		});
	}
}
