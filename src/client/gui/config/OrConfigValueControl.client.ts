import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { Element } from "shared/Element";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";

export type OrConfigControlDefinition = GuiObject & {
	readonly Dropdown: DropdownListDefinition;
	readonly Control: GuiObject;
};

type Type = BlockConfigTypes.Or;
class OrConfigValueControl extends ConfigValueControl<OrConfigControlDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.multiMulti(), definition.displayName);

		let currentType = this.sameOrUndefined(this.map(configs, (c) => c.type));

		const submit = (values: Readonly<Record<BlockUuid, Type["config"]["value"]>>) => {
			if (!currentType) return;

			const prev = configs;
			this._submitted.Fire(
				(configs = this.map(configs, (_, k) => ({ type: currentType!, value: values[k] }))),
				prev,
			);
		};

		let mcontrol:
			| MultiConfigControl<{ value: BlockConfigTypes.Types[Exclude<keyof BlockConfigTypes.Types, "or">] }>
			| undefined = undefined;
		const updateControl = () => {
			mcontrol?.destroy();

			if (currentType === undefined || currentType === "unset") {
				return;
			}

			const gui = Element.create("Frame", {
				BackgroundTransparency: 1,
				Size: new UDim2(1, 0, 0, 0),
				AutomaticSize: Enum.AutomaticSize.Y,
				Parent: this.gui.Control.Control,
			});

			const defs = { value: definition.types[currentType]! };
			mcontrol = this.add(new MultiConfigControl<typeof defs>(gui, configs, defs));
			mcontrol.configUpdated.Connect((_, values) => submit(values));
		};
		updateControl();

		const dropdown = this.add(
			new DropdownList<keyof typeof definition.types | "unset">(this.gui.Control.Dropdown, "down"),
		);
		this.event.subscribeObservable(dropdown.selectedItem, (typeid) => {
			// eslint-disable-next-line roblox-ts/lua-truthiness
			if (!typeid) {
				dropdown.selectedItem.set("unset");
				return;
			}

			currentType = typeid;

			const values = this.map(configs, (c, k) => {
				if (c.type === typeid) {
					return c.value;
				}

				return typeid === "unset" ? "unset" : definition.types[typeid]!.default;
			});

			submit(values);
			updateControl();
		});

		dropdown.addItem("unset");
		for (const [, type] of pairs(definition.types)) {
			dropdown.addItem(type.type);
		}

		dropdown.selectedItem.set(currentType);
	}
}
export type { OrConfigValueControl };

configControlRegistry.set("or", OrConfigValueControl);
