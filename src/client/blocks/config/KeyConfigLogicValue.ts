import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["key"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["key"]["default"]>,
		config: BlockConfigDefinitionRegistry["key"]["config"],
		definition: BlockConfigDefinitionRegistry["key"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
