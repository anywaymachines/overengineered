import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export class RadioRecieverBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radioreciever> {
	static readonly allRecievers = new Map<number, Set<RadioRecieverBlockLogic>>();

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radioreciever);

		const changeFrequency = (freq: number, prev: number) => {
			RadioRecieverBlockLogic.allRecievers.get(prev)?.delete(this);
			if (!RadioRecieverBlockLogic.allRecievers.get(freq))
				RadioRecieverBlockLogic.allRecievers.set(freq, new Set());
			RadioRecieverBlockLogic.allRecievers.get(freq)?.add(this);
		};

		//no direct reference makes me sad :'(
		this.event.subscribeObservable(this.input.frequency, changeFrequency);
	}
}
