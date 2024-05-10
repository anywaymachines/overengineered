import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";

export class CounterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.counter> {
	private currentValue: number = 0;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.counter);

		this.input.triggerStep.subscribe((v) => (v ? this.triggerStep() : undefined));
		this.input.value.subscribe((v) => this.rewriteValue(v));
	}

	private triggerStep() {
		this.currentValue += this.input.step.get();
		this.output.value.set(this.currentValue);
	}

	private rewriteValue(val: number) {
		this.currentValue = val;
		this.output.value.set(this.currentValue);
	}
}
