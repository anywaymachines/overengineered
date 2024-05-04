import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ByteConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Byte> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Byte["default"]>,
		config: BlockConfigTypes.Byte["config"],
		definition: BlockConfigTypes.Byte,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
