import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class DelayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.delayblock> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.delayblock.input>) {
		super(block, blockConfigRegistry.delayblock);

		this.event.subscribeObservable(
			this.input.value,
			(value) => {
				spawn(() => {
					task.wait(this.input.duration.get());

					this.output.result.set(value);
				});
			},
			true,
		);
	}
}
