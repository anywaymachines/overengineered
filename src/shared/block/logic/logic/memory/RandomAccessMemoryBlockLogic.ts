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

		const isReady = () => {
			if (!this.input.enabled.get()) return false;
			if (!this.input.read.get()) return false;
			if (this.input.address.get() >= this.size || this.input.address.get() < 0) {
				this.burn();
				return false;
			}
			return true;
		};

		const writeValue = () => {
			if (!isReady()) return;

			this.internalMemory[this.input.address.get()] = this.input.value.get();
			this.output.size.set(this.internalMemory.size());
		};

		const readValue = () => {
			if (!isReady()) return;

			this.output.result.set(this.internalMemory[this.input.address.get()]);
			this.output.size.set(this.internalMemory.size());
		};

		this.input.address.subscribe(writeValue);
		this.input.address.subscribe(readValue);
	}

	private burn() {
		RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
	}
}
