import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ClampedNumberConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["clampedNumber"]
> {
	constructor(
		observable: ObservableValue<BlockConfigDefinitionRegistry["number"]["default"]>,
		config: BlockConfigDefinitionRegistry["clampedNumber"]["config"],
		definition: BlockConfigDefinitionRegistry["clampedNumber"],
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
