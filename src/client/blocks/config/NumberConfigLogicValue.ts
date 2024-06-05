import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

export class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Number> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Number["config"]>,
		config: BlockConfigTypes.Number["config"],
		definition: BlockConfigTypes.Number,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
