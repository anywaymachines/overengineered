import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import Remotes from "shared/Remotes";

type DisconnectConfig = {
	readonly disconnect: "key";
};

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<DisconnectConfig> {
	protected prepare() {
		super.prepare();
		this.inputHandler.onKeyDown(Enum.KeyCode.X, () => this.keyPressed(Enum.KeyCode.X));
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
					Desktop: Enum.KeyCode.F,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
		};
	}
}
