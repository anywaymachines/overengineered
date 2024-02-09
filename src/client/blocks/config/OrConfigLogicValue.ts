import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class OrMotorAngleConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Or> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.Or["config"]>,
		config: BlockConfigTypes.Or["config"],
		definition: BlockConfigTypes.Or,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
