import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.Key> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.Key["default"]>,
		config: BlockConfigTypes.Key["config"],
		definition: BlockConfigTypes.Key,
	) {
		super(observable, config, definition);
		this.value.set(config);
	}
}
