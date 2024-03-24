import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class StringConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.String> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.String["default"]>,
		config: BlockConfigTypes.String["config"],
		definition: BlockConfigTypes.String,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
