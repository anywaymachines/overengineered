import { DropdownList, DropdownListDefinition } from "client/gui/controls/DropdownList";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";

export type { DropdownConfigValueControl };
class DropdownConfigValueControl<T extends string = string> extends ConfigValueControl<DropdownListDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Dropdown<T>["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Dropdown<T>["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Dropdown<T>>,
	) {
		super(playerConfigValueTemplateStorage.dropdown(), definition.displayName);

		const control = this.add(new DropdownList<T>(this.gui.Control, "down"));
		for (const item of definition.items) {
			control.addItem(item);
		}
		control.selectedItem.set(config);

		this.event.subscribeObservable(
			control.selectedItem,
			(value) => value !== undefined && this.submitted.Fire(value),
		);
	}
}

playerConfigControlRegistry.set("dropdown", DropdownConfigValueControl);
