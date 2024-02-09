import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Bool> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.Bool["default"]>,
		config: BlockConfigTypes.Bool["config"],
		definition: BlockConfigTypes.Bool,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
