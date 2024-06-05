import { ToggleControl } from "client/gui/controls/ToggleControl";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";

class BoolConfigValueControl extends ConfigValueControl<ToggleControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Bool["config"]) => void>();

	constructor(config: PlayerConfigTypes.Bool["config"], definition: ConfigTypeToDefinition<PlayerConfigTypes.Bool>) {
		super(playerConfigValueTemplateStorage.toggle(), definition.displayName);

		const control = this.add(new ToggleControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}
export type { BoolConfigValueControl };

playerConfigControlRegistry.set("bool", BoolConfigValueControl);
