import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ClampedNumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.ClampedNumber> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.ClampedNumber["default"]>,
		config: BlockConfigTypes.ClampedNumber["config"],
		definition: BlockConfigTypes.ClampedNumber,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
