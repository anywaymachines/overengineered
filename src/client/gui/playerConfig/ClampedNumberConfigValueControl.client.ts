import { SliderControl, SliderControlDefinition } from "client/gui/controls/SliderControl";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";

export type { ClampedNumberConfigValueControl };
class ClampedNumberConfigValueControl extends ConfigValueControl<SliderControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.ClampedNumber["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.ClampedNumber["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.ClampedNumber>,
	) {
		super(playerConfigValueTemplateStorage.slider(), definition.displayName);

		const control = this.add(new SliderControl(this.gui.Control, definition.min, definition.max, definition.step));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

playerConfigControlRegistry.set("clampedNumber", ClampedNumberConfigValueControl);
