import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

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
