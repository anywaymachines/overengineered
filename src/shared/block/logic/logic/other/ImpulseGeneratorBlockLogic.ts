import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class ImpulseGeneratorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.impulsegenerator> {
	private impulses = 0;
	private didImpulse = false;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.impulsegenerator);

		this.input.isInverted.subscribe(() => this.output.value.set(!this.output.value.get()));
	}

	tick(tick: number): void {
		super.tick(tick);
		if (this.didImpulse) {
			this.output.value.set(!this.output.value.get());
			this.didImpulse = false;
		}
		this.impulses++;
		const delay = math.max(this.input.delay.get(), 1);
		this.impulses %= delay;
		if (this.impulses !== 0) return;
		this.didImpulse = this.input.isSinglePulse.get();
		this.output.value.set(!this.output.value.get());
	}
}
