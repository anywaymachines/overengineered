import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class DisconnectBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.disconnectblock> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("disconnectblock_disconnect"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.disconnectblock);

		this.event.subscribeObservable(
			this.input.disconnect,
			(disconnect) => {
				if (disconnect !== true) return;
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
