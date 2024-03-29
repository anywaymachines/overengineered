import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export default class DisconnectBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.disconnectblock> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("disconnectblock_disconnect"),
	} as const;

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
		DisconnectBlockLogic.events.disconnect.send({ block: this.instance });
		this.disable();
	}
}
