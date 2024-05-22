import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

export class KeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Key> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Key["default"]>,
		config: BlockConfigTypes.Key["config"],
		definition: BlockConfigTypes.Key,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
