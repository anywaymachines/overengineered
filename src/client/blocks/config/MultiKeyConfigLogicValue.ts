import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

export class MultiKeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.MultiKey> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.MultiKey["default"]>,
		config: BlockConfigTypes.MultiKey["config"],
		definition: BlockConfigTypes.MultiKey,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
