import { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import ObservableValue from "shared/event/ObservableValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyBoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigTypes.KeyBool> {
	constructor(
		observable: ObservableValue<BlockConfigTypes.KeyBool["default"]>,
		config: BlockConfigTypes.KeyBool["config"],
		definition: BlockConfigTypes.KeyBool,
	) {
		super(observable, config, definition);
		this.value.set(config.reversed);

		if (this.definition.canBeSwitch && this.config.switch) {
			this.event.onKeyDown(this.config.key, () => this.value.set(!this.value.get()));
		} else {
			this.event.onKeyDown(this.config.key, () => this.value.set(!config.reversed));
			this.event.onKeyUp(this.config.key, () => this.value.set(config.reversed));
		}
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [
			{
				name: this.config.key,
				press: () => this.value.set(true),
				release: () => this.value.set(false),
				isPressed: () => this.value.get(),
				toggleMode: this.definition.canBeSwitch && this.config.switch,
			},
		];
	}
}
