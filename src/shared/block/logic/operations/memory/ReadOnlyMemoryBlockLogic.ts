import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";

export class ReadOnlyMemoryBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.readonlymemory> {
	private readonly size = blockConfigRegistry.readonlymemory.input.menu.lengthLimit;
	private readonly internalMemory: Parameters<typeof this.output.result.set>[0][] = [];

	private burn() {
		RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.readonlymemory);
		const mem = this.input.menu.get();

		for (let i = 0; i < this.size; i++) {
			this.internalMemory[i] = mem[i] ?? 0;
		}

		const readValue = (address: number) => {
			if (!this.input.read.get()) return;
			if (address >= this.size || address < 0) {
				this.burn();
				return;
			}
			const value = this.internalMemory[this.input.address.get()];
			this.output.result.set(value);
			this.output.size.set(this.internalMemory.size());
		};

		this.input.address.subscribe(readValue);
	}
}
