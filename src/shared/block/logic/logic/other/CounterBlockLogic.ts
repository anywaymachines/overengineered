import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class CounterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.counter> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.counter);

		this.onEnable(() => this.output.value.set(this.input.value.get()));

		this.input.triggerStep.subscribe((v) => {
			if (!v) return;

			if (this.input.triggerValue.get()) return this.output.value.set(this.input.value.get());
			this.output.value.set(this.output.value.get() + this.input.step.get());
		});

		this.input.triggerValue.subscribe((v) => {
			if (!v) return;
			this.output.value.set(this.input.value.get());
		});
	}
}
