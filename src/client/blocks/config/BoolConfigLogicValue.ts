import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["bool"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["bool"]["default"]>,
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigDefinitionRegistry["bool"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
