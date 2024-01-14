import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class ClampedNumberConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["clampedNumber"]
> {
	constructor(
		config: BlockConfigDefinitionRegistry["clampedNumber"]["config"],
		definition: BlockConfigDefinitionRegistry["clampedNumber"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}

	protected createObservable() {
		return new NumberObservableValue(
			this.definition.default,
			this.definition.min,
			this.definition.max,
			this.definition.step,
		);
	}
}
