import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Number> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.Number["config"]>,
		config: BlockConfigTypes.Number["config"],
		definition: BlockConfigTypes.Number,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
