import { IBlockLogicValue } from "shared/block/BlockLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class Vector3ConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Vec3> {
	constructor(
		observable: IBlockLogicValue<BlockConfigTypes.Vec3["default"]>,
		config: BlockConfigTypes.Vec3["config"],
		definition: BlockConfigTypes.Vec3,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
