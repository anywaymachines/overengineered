import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class StringConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.String> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.String["default"]>,
		config: BlockConfigTypes.String["config"],
		definition: BlockConfigTypes.String,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
