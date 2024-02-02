import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class OrMotorAngleConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["or"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["or"]["config"]>,
		config: BlockConfigDefinitionRegistry["or"]["config"],
		definition: BlockConfigDefinitionRegistry["or"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
