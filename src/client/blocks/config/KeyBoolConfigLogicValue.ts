import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyBoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["keybool"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["keybool"]["config"],
		definition: BlockConfigDefinitionRegistry["keybool"],
		connected: boolean,
		controlsEnabled: ReadonlyObservableValue<boolean>,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			if (this.definition.canBeSwitch && this.config.switch) {
				this.event.onKeyDown(this.config.key, () => {
					if (!controlsEnabled.get()) return;
					this.value.set(!this.value.get());
				});
			} else {
				this.event.onKeyDown(this.config.key, () => this.value.set(true));
				this.event.onKeyUp(this.config.key, () => this.value.set(false));
			}
		}
	}
}
