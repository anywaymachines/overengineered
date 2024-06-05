import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class StackMemoryBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.stackmemory> {
	private readonly size = 32;
	private readonly internalMemory: Parameters<typeof this.output.result.set>[0][] = [];

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.stackmemory);

		this.input.push.subscribe((v) => (v ? this.pushValue() : undefined));
		this.input.pop.subscribe((v) => (v ? this.popValue() : undefined));
	}

	private pushValue() {
		if (this.internalMemory.size() >= this.size) {
			this.burn();
			return;
		}
		const value = this.input.value.get();
		this.internalMemory.push(value);
		this.output.size.set(this.internalMemory.size());
	}

	private popValue() {
		const value = this.internalMemory.pop();
		if (value === undefined) {
			this.burn();
			return;
		}
		this.output.result.set(value);
		this.output.size.set(this.internalMemory.size());
	}

	private burn() {
		RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
	}
}
