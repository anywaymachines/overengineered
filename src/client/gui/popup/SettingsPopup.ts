import PlayerDataStorage from "client/PlayerDataStorage";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import { BlockConfigDefinition } from "shared/block/config/BlockConfigDefinitionRegistry";
import GameDefinitions from "shared/data/GameDefinitions";
import ObservableValue from "shared/event/ObservableValue";
import { JsonSerializablePrimitive } from "shared/fixes/Json";
import Objects from "shared/fixes/objects";

class ConfigPartControl<
	TControl extends Control<TDef>,
	TDef extends GuiObject,
	TValue extends JsonSerializablePrimitive,
> extends Control<ConfigPartDefinition<TDef>> {
	readonly control: TControl & { value: ObservableValue<TValue> };
	readonly key;
	readonly definition;

	constructor(
		gui: ConfigPartDefinition<TDef>,
		ctor: (gui: TDef) => TControl & { value: ObservableValue<TValue> },
		configs: readonly Record<string, unknown>[],
		definition: BlockConfigDefinition,
		key: string,
	) {
		super(gui);
		this.key = key;
		this.definition = definition;

		this.gui.HeadingLabel.Text = definition.displayName;
		this.control = ctor(this.gui.Control);
		this.control.value.set(configs[0][key] as TValue);

		this.add(this.control);
	}
}

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

export type SettingsDefinition = GuiObject & {
	readonly CheckboxTemplate: ConfigPartDefinition<ToggleControlDefinition>;
};

export type SettingsPopupDefinition = GuiObject & {
	readonly Content: {
		readonly ScrollingFrame: SettingsDefinition;
	};
	readonly Buttons: {
		readonly CancelButton: GuiButton;
	};
	readonly Head: {
		readonly CloseButton: GuiButton;
	};
};

export default class SettingsPopup extends Popup<SettingsPopupDefinition> {
	private readonly checkboxTemplate;
	private readonly list;

	static showPopup() {
		const popup = new SettingsPopup(
			Gui.getGameUI<{
				Popup: {
					Settings: SettingsPopupDefinition;
				};
			}>().Popup.Settings.Clone(),
		);

		popup.show();
	}
	constructor(gui: SettingsPopupDefinition) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.Content.ScrollingFrame.CheckboxTemplate);

		this.list = new Control(this.gui.Content.ScrollingFrame);
		this.add(this.list);

		this.add(new ButtonControl(this.gui.Buttons.CancelButton, () => this.hide()));
		this.add(new ButtonControl(this.gui.Head.CloseButton, () => this.hide()));

		this.event.subscribeObservable(
			PlayerDataStorage.config,
			(config) => {
				if (!config) return;
				this.create();
			},
			true,
		);
	}

	private create() {
		const config = PlayerDataStorage.config.get();
		this.list.clear();

		for (const [id, def] of Objects.pairs(GameDefinitions.PLAYER_SETTINGS_DEFINITION)) {
			if (def.type === "bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new ToggleControl(cb),
					[config],
					def,
					id,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => PlayerDataStorage.sendPlayerConfigValue(id, value));
			} /* else if (def.type === "key") {
					const control = new ConfigPartControl(
						this.keyTemplate(),
						(kb) => new KeyChooserControl(kb),
						config,
						def,
						id,
					);
					this.list.add(control);
	
					control.control.submitted.Connect((value) => send(id, value));
				} else if (def.type === "number") {
					const control = new ConfigPartControl(
						this.sliderTemplate(),
						(cb) => new SliderControl(cb, def.min, def.max, def.step),
						config,
						def,
						id,
					);
					this.list.add(control);
	
					control.control.submitted.Connect((value) => send(id, value));
				}*/
		}
	}
}
