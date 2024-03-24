import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Bool> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Bool["default"]>,
		config: BlockConfigTypes.Bool["config"],
		definition: BlockConfigTypes.Bool,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
