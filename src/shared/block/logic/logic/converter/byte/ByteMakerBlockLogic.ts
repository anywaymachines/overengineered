import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class ByteMakerBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.bytemaker> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.bytemaker.input>) {
		super(block, blockConfigRegistry.bytemaker);

		this.input["1"].subscribe(() => this.update());
		this.input["2"].subscribe(() => this.update());
		this.input["4"].subscribe(() => this.update());
		this.input["8"].subscribe(() => this.update());
		this.input["16"].subscribe(() => this.update());
		this.input["32"].subscribe(() => this.update());
		this.input["64"].subscribe(() => this.update());
		this.input["128"].subscribe(() => this.update());
	}

	private update() {
		this.output.value.set(
			this.booleansToNumber([
				this.input["128"].get(),
				this.input["64"].get(),
				this.input["32"].get(),
				this.input["16"].get(),
				this.input["8"].get(),
				this.input["4"].get(),
				this.input["2"].get(),
				this.input["1"].get(),
			]),
		);
	}

	private booleansToNumber(boolArray: boolean[]) {
		let result = 0;
		for (let i = 0; i < boolArray.size(); i++) {
			if (boolArray[i]) {
				result += math.pow(2, boolArray.size() - 1 - i);
			}
		}
		return result;
	}
}
