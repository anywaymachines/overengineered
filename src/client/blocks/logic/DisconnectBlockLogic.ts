import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Remotes from "shared/Remotes";
import { ConfigTypesToDefinition } from "../../../shared/Configuration";

type DisconnectConfig = {
	readonly disconnect: "key";
};

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<DisconnectConfig> {
	protected prepare() {
		super.prepare();

		const disconnectButton = this.config.get("disconnect");
		this.inputHandler.onKeyDown(disconnectButton, () => this.keyPressed(Enum.KeyCode.X));
	}

	private keyPressed(keyCode: Enum.KeyCode) {
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("DisconnectBlock")
			.Get("Disconnect")
			.SendToServer(this.block);
	}

	public getConfigDefinition(): ConfigTypesToDefinition<DisconnectConfig> {
		return {
			disconnect: {
				id: "disconnect",
				displayName: "Disconnect key",
				type: "key",
				default: {
					Desktop: "F",
					Gamepad: "ButtonR2",
				},
			},
		};
	}
}
