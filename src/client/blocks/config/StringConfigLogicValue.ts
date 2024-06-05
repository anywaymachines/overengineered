import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

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
