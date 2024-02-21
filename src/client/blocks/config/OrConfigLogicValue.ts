import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class OrConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Or> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.Or["default"]>,
		config: BlockConfigTypes.Or["config"],
		definition: BlockConfigTypes.Or,
	) {
		super(observable, config, definition);
		this.value.set(config.value);
	}
}
