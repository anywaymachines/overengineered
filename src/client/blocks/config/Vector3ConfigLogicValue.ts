import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class Vector3ConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["vector3"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["vector3"]["default"]>,
		config: BlockConfigDefinitionRegistry["vector3"]["config"],
		definition: BlockConfigDefinitionRegistry["vector3"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
