import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

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
