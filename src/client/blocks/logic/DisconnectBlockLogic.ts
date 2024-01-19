import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.disconnectblock> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.disconnectblock);

		this.event.subscribeObservable(
			this.input.disconnect,
			(disconnect) => {
				if (!disconnect) return;
				this.disconnect();
			},
			true,
		);
	}

	private disconnect() {
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("DisconnectBlock")
			.Get("Disconnect")
			.SendToServer(this.instance);

		this.disable();
	}
}
