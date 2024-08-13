import { Colors } from "client/gui/Colors";
import { ButtonControl, TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { MultiPlayerConfigControl } from "client/gui/PlayerConfigControls";
import { Popup } from "client/gui/Popup";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { NewSettingsPopup } from "client/gui/popup/NewSettingsPopup";
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
			(config) => {
				this.config.set(config, PlayerConfigDefinition);

				const btn = this.config.add(
					new TextButtonControl(
						Gui.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
						() => {
							const popup = di.resolve<NewSettingsPopup>();
							popup.setScene("Permissions");
							popup.show();
							this.hide();
						},
					),
				);
				btn.instance.LayoutOrder = 0;
				btn.instance.BackgroundColor3 = Colors.accentDark;
				btn.instance.Size = new UDim2(new UDim(1, 0), btn.instance.Size.Y);
				btn.text.set("Permissions");
			},
			true,
		);
	}
}
