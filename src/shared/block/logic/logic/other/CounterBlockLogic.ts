import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class CounterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.counter> {
	private currentValue: number = 0;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.counter);

		this.input.triggerStep.subscribe((v) => (v ? this.triggerStep() : undefined));
	}

	private triggerStep() {
		if (this.input.triggerValue.get()) {
			this.currentValue = this.input.value.get();
		} else {
			this.currentValue += this.input.step.get();
		}
		this.output.value.set(this.currentValue);
	}
}
