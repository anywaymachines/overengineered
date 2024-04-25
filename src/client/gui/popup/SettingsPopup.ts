import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

export type SettingsPopupDefinition = GuiObject & {
	readonly Content: {
		readonly ScrollingFrame: ScrollingFrame;
	};
	readonly Buttons: {
		readonly CancelButton: GuiButton;
	};
	readonly Head: {
		readonly CloseButton: GuiButton;
	};
};

export class SettingsPopup extends Popup<SettingsPopupDefinition> {
	private readonly config;

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

		this.config = this.add(new MultiPlayerConfigControl<PlayerConfigDefinition>(this.gui.Content.ScrollingFrame));

		this.event.subscribe(this.config.configUpdated, async (key, value) => {
			await PlayerDataStorage.sendPlayerConfigValue(key, value as PlayerConfig[keyof PlayerConfig]);
		});

		this.add(new ButtonControl(this.gui.Buttons.CancelButton, () => this.hide()));
		this.add(new ButtonControl(this.gui.Head.CloseButton, () => this.hide()));

		this.event.subscribeObservable(
			PlayerDataStorage.config,
			(config) => {
				if (!config) return;
				this.config.set(PlayerDataStorage.config.get(), PlayerConfigDefinition);
			},
			true,
		);
	}
}
