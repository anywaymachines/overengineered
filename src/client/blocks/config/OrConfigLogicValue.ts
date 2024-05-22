import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

export class OrConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Or> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Or["default"]>,
		config: BlockConfigTypes.Or["config"],
		definition: BlockConfigTypes.Or,
	) {
		super(observable, config, definition);

		if (config.type !== "unset") {
			this.value.set(config.value);
		}
	}
}
