import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class Multiplexer extends ConfigurableBlockLogic<typeof blockConfigRegistry.multiplexer> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.multiplexer);

		this.event.subscribeObservable(this.input.falsenumber.value, () => this.update());
		this.event.subscribeObservable(this.input.truenumber.value, () => this.update());
		this.event.subscribeObservable(this.input.value.value, () => this.update());
	}

	private update() {
		this.output.result.set(
			this.input.value.value.get() === true
				? this.input.truenumber.value.get()
				: this.input.falsenumber.value.get(),
		);
	}
}
