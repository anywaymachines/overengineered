import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class ReadOnlyMemoryBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.readonlymemory> {
	private readonly LIMIT = blockConfigRegistry.readonlymemory.input.data.lengthLimit;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.readonlymemory);

		const readValue = () => {
			if (!this.input.read.get()) return;

			const address = this.input.address.get();
			if (address >= this.LIMIT || address < 0) {
				RemoteEvents.Burn.send([this.instance.PrimaryPart!]);
				this.disable();
				return;
			}

			this.output.output1.set(this.input.data.get()[address] ?? 0);
			this.output.output2.set(this.input.data.get()[address + 1] ?? 0);
			this.output.output3.set(this.input.data.get()[address + 2] ?? 0);
			this.output.output4.set(this.input.data.get()[address + 3] ?? 0);
		};

		this.input.address.subscribe(readValue);
		this.input.read.subscribe(readValue);

		this.event.subscribeObservable(this.input.data, (menu) => this.output.size.set(menu.size()));
	}
}
