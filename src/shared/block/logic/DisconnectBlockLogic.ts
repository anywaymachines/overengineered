import Remotes from "shared/Remotes";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import ConfigurableBlockLogic from "../ConfigurableBlockLogic";

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
