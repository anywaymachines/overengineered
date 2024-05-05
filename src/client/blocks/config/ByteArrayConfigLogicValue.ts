import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ByteArrayConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.ByteArray> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.ByteArray["default"]>,
		config: BlockConfigTypes.ByteArray["config"],
		definition: BlockConfigTypes.ByteArray,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
