import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.disconnectblock> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.disconnectblock);
	}

	static getConfigDefinition() {
		return blockConfigRegistry.disconnectblock;
	}

	public getKeysDefinition(): KeyDefinitions<typeof blockConfigRegistry.disconnectblock.input> {
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
