import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class RandomAccessMemoryBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.randomaccessmemory
> {
	private readonly size = 0xff;
	private readonly internalMemory: Parameters<typeof this.output.result.set>[0][] = [];

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.randomaccessmemory);
		this.input.value.subscribe(this.writeValue);
	}

	isReady() {
		if (this.input.address.get() > this.size || this.input.address.get() < 0) {
			RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
			return false;
		}
		return true;
	}

	writeValue() {
		if (!this.isReady()) return;
		if (!this.input.write.get()) return;
		this.internalMemory[this.input.address.get()] = this.input.value.get();
		this.output.size.set(this.internalMemory.size());
	}

	readValue() {
		if (!this.isReady()) return;
		this.output.result.set(this.internalMemory[this.input.address.get()]);
		this.output.size.set(this.internalMemory.size());
	}

	tick(tick: number): void {
		if (this.input.read.get()) this.readValue();
		super.tick(tick);
	}
}
