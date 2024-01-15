import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class OrMotorAngleConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["or"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["or"]["config"],
		definition: BlockConfigDefinitionRegistry["or"],
		connected: boolean,
		controlsEnabled: ReadonlyObservableValue<boolean>,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
