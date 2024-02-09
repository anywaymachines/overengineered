import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MultiKeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.MultiKey> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.MultiKey["default"]>,
		config: BlockConfigTypes.MultiKey["config"],
		definition: BlockConfigTypes.MultiKey,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
