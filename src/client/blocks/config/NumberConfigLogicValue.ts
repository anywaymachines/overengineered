import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["number"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["number"]["config"]>,
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigDefinitionRegistry["number"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
