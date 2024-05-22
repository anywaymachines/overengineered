import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class DelayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.delayblock> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.delayblock.input>) {
		super(block, blockConfigRegistry.delayblock);

		this.event.subscribeObservable(this.input.value, (value) => {
			if (this.input.duration.get() > 0) {
				task.delay(this.input.duration.get(), () => this.output.result.set(value));
			}
		});
	}
}
