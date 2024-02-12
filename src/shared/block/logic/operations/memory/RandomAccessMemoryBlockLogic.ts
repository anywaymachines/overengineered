import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import RemoteEvents from "shared/RemoteEvents";

export default class RandomAccessMemoryBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.randomaccessmemory
> {
	private readonly size = 256;
	private readonly internalMemory: ReturnType<typeof this.output.result.get>[] = [];

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.randomaccessmemory);

		this.input.mode.subscribe((v) => (v ? undefined : this.readValue()));
		this.input.value.subscribe((v) => (this.input.mode ? this.writeValue() : undefined));
	}

	private writeValue() {
		if (!this.input.enabled.get()) return;
		if (this.input.address.get() > this.size) {
			this.burn();
			return;
		}
		if (this.input.address.get() < 0) {
			this.burn();
			return;
		}
		const value = this.input.value.get();
		this.internalMemory[this.input.address.get()] = value;
		this.output.size.set(this.internalMemory.size());
	}

	private readValue() {
		if (!this.input.enabled.get()) return;
		if (this.input.address.get() > this.size) {
			this.burn();
			return;
		}
		if (this.input.address.get() < 0) {
			this.burn();
			return;
		}
		const value = this.internalMemory[this.input.address.get()];
		this.output.result.set(value);
		this.output.size.set(this.internalMemory.size());
	}

	private burn() {
		RemoteEvents.Burn.send(this.instance.PrimaryPart!);
	}
}
