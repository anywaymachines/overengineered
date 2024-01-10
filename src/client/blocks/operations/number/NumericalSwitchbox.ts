import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";

export default class NumericalSwitchbox extends ConfigurableBlockLogic<typeof blockConfigRegistry.numericalswitchbox> {
	constructor(block: BlockModel) {
		super(block, blockConfigRegistry.numericalswitchbox);

		this.event.subscribeObservable(this.inputConfig.values.falsenumber.value, () => this.update());
		this.event.subscribeObservable(this.inputConfig.values.truenumber.value, () => this.update());
		this.event.subscribeObservable(this.inputConfig.values.value.value, () => this.update());
		this.update();
	}

	private update() {
		this.outputConfig.values.result.set(
			this.inputConfig.values.value.value.get() === true
				? this.inputConfig.values.truenumber.value.get()
				: this.inputConfig.values.falsenumber.value.get(),
		);
	}
}
