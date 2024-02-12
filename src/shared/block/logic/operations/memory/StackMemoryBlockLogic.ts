import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import RemoteEvents from "shared/RemoteEvents";

export default class StackMemoryBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.stackmemory> {
	private readonly size = 32;
	private readonly internalMemory: ReturnType<typeof this.output.result.get>[] = [];

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
		RemoteEvents.Burn.send(this.instance.PrimaryPart!);
	}
}
