import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ColorConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Color> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Color["default"]>,
		config: BlockConfigTypes.Color["config"],
		definition: BlockConfigTypes.Color,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
