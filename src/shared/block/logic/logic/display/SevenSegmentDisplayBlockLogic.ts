import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class SevenSegmentDisplayBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.sevensegmentdisplay
> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly code: number;
		}>("sevensegmentdisplay_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.sevensegmentdisplay);

		const updateState = () => {
			SevenSegmentDisplayBlockLogic.events.update.send({
				block: block.instance,
				code: this.input.value.get(),
			});
		};

		this.event.subscribeObservable(this.input.value, updateState);
	}
}
