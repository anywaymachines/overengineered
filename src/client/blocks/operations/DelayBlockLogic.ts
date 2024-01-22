import { BlockLogicData } from "client/base/BlockLogic";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class DelayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.delayblock> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.delayblock.input>) {
		super(block, blockConfigRegistry.delayblock);

		this.event.subscribeObservable(this.input.value, (value) => {
			spawn(() => {
				task.wait(this.input.duration.get());

				this.output.result.set(value);
			});
		});
	}
}
