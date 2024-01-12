import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.disconnectblock> {
	constructor(block: PlacedBlockData) {
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
						.SendToServer(this.instance);
				},
			},
		};
	}
}
