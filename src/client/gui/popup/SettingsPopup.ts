import { Config } from "client/Config";
import Control from "client/base/Control";
import Popup from "client/base/Popup";
import GuiController from "client/controller/GuiController";
import GameDefinitions from "shared/GameDefinitions";
import Objects from "shared/Objects";
import Remotes from "shared/Remotes";
import { ButtonControl } from "../controls/Button";
import CheckBoxControl, { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import { ConfigPartControl } from "../scenes/ConfigToolScene";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	HeadingLabel: TextLabel;
	Control: T;
};

export type SettingsDefinition = GuiObject & {
	CheckboxTemplate: ConfigPartDefinition<CheckBoxControlDefinition>;
};

export type SettingsPopupDefinition = GuiObject & {
	Body: GuiObject & {
		Body: GuiObject & {
			ScrollingFrame: SettingsDefinition;
			CancelButton: GuiButton;
			CloseButton: GuiButton;
		};
	};
};

export default class SettingsPopup extends Popup<SettingsPopupDefinition> {
	public static readonly instance = new SettingsPopup(
		GuiController.getGameUI<{
			Popup: {
				SettingsGui: SettingsPopupDefinition;
			};
		}>().Popup.SettingsGui,
	);

	private readonly checkboxTemplate;
	private readonly list;

	constructor(gui: SettingsPopupDefinition) {
		super(gui);

		this.checkboxTemplate = Control.asTemplate(this.gui.Body.Body.ScrollingFrame.CheckboxTemplate);

		this.list = new Control(this.gui.Body.Body.ScrollingFrame);
		this.add(this.list);

		const closeButton = this.added(new ButtonControl(this.gui.Body.Body.CloseButton));
		this.event.subscribe(closeButton.activated, () => this.hide());

		const config = new Config({}, GameDefinitions.PLAYER_SETTINGS_DEFINITION);

		const send = (key: keyof typeof GameDefinitions.PLAYER_SETTINGS_DEFINITION, value: ConfigValue) => {
			print("sending " + key + " " + Config.serializeOne(value, GameDefinitions.PLAYER_SETTINGS_DEFINITION[key]));

			Remotes.Client.GetNamespace("Player")
				.Get("UpdateSettings")
				.SendToServer({
					key,
					value: Config.serializeOne(value, GameDefinitions.PLAYER_SETTINGS_DEFINITION[key]),
				});
		};

		for (const [id, def] of Objects.entries(GameDefinitions.PLAYER_SETTINGS_DEFINITION)) {
			if (def.type === "bool") {
				const control = new ConfigPartControl(
					this.checkboxTemplate(),
					(cb) => new CheckBoxControl(cb),
					config,
					def,
					id,
					false as boolean,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			} /* else if (def.type === "key") {
				const control = new ConfigPartControl(
					this.keyTemplate(),
					(kb) => new KeyChooserControl(kb),
					config,
					def,
					id,
					Enum.KeyCode.P,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			} else if (def.type === "number") {
				const control = new ConfigPartControl(
					this.sliderTemplate(),
					(cb) => new SliderControl(cb, def.min, def.max, def.step),
					config,
					def,
					id,
					0,
				);
				this.list.add(control);

				control.control.submitted.Connect((value) => send(def.id, value));
			}*/
		}
	}
}
