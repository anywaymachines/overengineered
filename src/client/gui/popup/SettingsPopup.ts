import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { Popup } from "client/gui/Popup";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

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

@injectable
export class SettingsPopup extends Popup<SettingsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Settings: SettingsPopupDefinition } }>().Popup.Settings;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	private readonly config;

	constructor(gui: SettingsPopupDefinition, @inject playerData: PlayerDataStorage, @inject di: DIContainer) {
		super(gui);

		this.config = this.add(
			new MultiPlayerConfigControl<PlayerConfigDefinition>(this.gui.Content.ScrollingFrame, di),
		);

		this.event.subscribe(this.config.configUpdated, async (key, value) => {
			await playerData.sendPlayerConfigValue(key, value as PlayerConfig[keyof PlayerConfig]);
		});

		this.add(new ButtonControl(this.gui.Buttons.CancelButton, () => this.hide()));
		this.add(new ButtonControl(this.gui.Head.CloseButton, () => this.hide()));

		this.event.subscribeObservable(
			playerData.config,
			(config) => this.config.set(config, PlayerConfigDefinition),
			true,
		);
	}
}
