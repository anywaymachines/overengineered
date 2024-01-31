import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MultiKeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["multikey"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["multikey"]["default"]>,
		config: BlockConfigDefinitionRegistry["multikey"]["config"],
		definition: BlockConfigDefinitionRegistry["multikey"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
