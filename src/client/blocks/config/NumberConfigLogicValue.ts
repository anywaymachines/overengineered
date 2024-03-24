import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

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
