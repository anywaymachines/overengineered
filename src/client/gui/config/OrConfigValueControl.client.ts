import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { DropdownListDefinition } from "client/gui/controls/DropdownList";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

export type OrConfigControlDefinition = GuiObject & {
	readonly Dropdown: DropdownListDefinition;
	readonly Control: ConfigControlDefinition;
};
class OrConfigValueControl extends ConfigValueControl<OrConfigControlDefinition> {
	readonly submitted = new Signal<(config: Readonly<Record<BlockUuid, BlockConfigTypes.Or["config"]>>) => void>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Or["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Or>,
	) {
		super(configValueTemplateStorage.multiMulti(), definition.displayName);

		// TODO:
		/*let selected = this.sameOrUndefined(this.map(configs, (c) => c.type));
		configs = this.map(configs, (config) => {
			if (config.value === undefined && selected !== undefined && selected !== "unset") {
				return { ...config, value: definition.types[selected]?.config as never };
			}

			return config;
		});

		const updateConfig = (value: (typeof configs)[keyof typeof configs]["value"]) => {
			this.submitted.Fire((configs = this.map(configs, () => ({ type: selected, value }))));
		};

		const control = this.add(new ConfigControl(this.gui.Control.Control));
		this.event.subscribe(control.configUpdated, (_, value) => updateConfig(value as typeof config.value));
		if (config.type !== "unset") {
			control.set({ value: config.value }, { value: definition.types[config.type]! });
		}

		const dropdown = this.add(
			new DropdownList<keyof typeof definition.types | "unset">(this.gui.Control.Dropdown, "down"),
		);
		this.event.subscribeObservable(dropdown.selectedItem, (typeid) => {
			// eslint-disable-next-line roblox-ts/lua-truthiness
			if (!typeid) {
				dropdown.selectedItem.set(config.type);
				return;
			}

			if (typeid === "unset") {
				control.clear();
				updateConfig("unset");
				return;
			}

			const deftype = definition.types[typeid]!;
			selected = deftype.type;

			if (config.type === deftype.type) {
				// use existing value
				control.set({ value: config.value }, { value: deftype });
				updateConfig(config.value);
			} else {
				// use default value
				control.set({ value: deftype.config }, { value: deftype });
				updateConfig(deftype.config as typeof config.value);
			}
		});

		dropdown.addItem("unset");
		for (const [, type] of Objects.pairs_(definition.types)) {
			dropdown.addItem(type.type);
		}

		dropdown.selectedItem.set(config.type);*/
	}
}
export type { OrConfigValueControl };

configControlRegistry.set("or", OrConfigValueControl);
