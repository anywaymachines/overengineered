import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";

class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Number["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Number["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Number>,
	) {
		super(playerConfigValueTemplateStorage.number(), definition.displayName);

		const control = this.add(new NumberTextBoxControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

playerConfigControlRegistry.set("number", NumberConfigValueControl);
