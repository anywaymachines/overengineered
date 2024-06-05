import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class ByteSplitterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.bytesplitter> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.bytesplitter.input>) {
		super(block, blockConfigRegistry.bytesplitter);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		const res = this.numberToBooleans(this.input.value.get());

		this.output["128"].set(res[7]);
		this.output["64"].set(res[6]);
		this.output["32"].set(res[5]);
		this.output["16"].set(res[4]);
		this.output["8"].set(res[3]);
		this.output["4"].set(res[2]);
		this.output["2"].set(res[1]);
		this.output["1"].set(res[0]);
	}

	private numberToBooleans(num: number): boolean[] {
		const booleans: boolean[] = [];
		for (let i = 7; i >= 0; i--) {
			booleans.push((num & (1 << i)) !== 0);
		}
		return booleans;
	}
}
