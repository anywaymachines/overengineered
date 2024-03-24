import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

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
