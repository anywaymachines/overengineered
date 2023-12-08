import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import Remotes from "shared/Remotes";

type DisconnectConfig = {
	readonly disconnect: "key";
};

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<DisconnectConfig> {
	public getConfigDefinition(): ConfigTypesToDefinition<DisconnectConfig> {
		return {
			disconnect: {
				displayName: "Disconnect key",
				type: "key",
				default: {
					Desktop: "F",
					Gamepad: "ButtonR2",
				},
			},
		};
	}

	public getKeysDefinition(): KeyDefinitions<DisconnectConfig> {
		return {
			disconnect: {
				keyDown: () => {
					Remotes.Client.GetNamespace("Blocks")
						.GetNamespace("DisconnectBlock")
						.Get("Disconnect")
						.SendToServer(this.block);
				},
			},
		};
	}
}
