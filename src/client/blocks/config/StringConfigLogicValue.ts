import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class StringConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["string"]> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["string"]["default"]>,
		config: BlockConfigDefinitionRegistry["string"]["config"],
		definition: BlockConfigDefinitionRegistry["string"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
