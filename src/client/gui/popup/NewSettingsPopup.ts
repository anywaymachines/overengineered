import { ButtonControl } from "client/gui/controls/Button";
import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import type { PlayerSelectorColumnControlDefinition } from "client/gui/controls/PlayerSelectorListControl";

export type NewSettingsPopupDefinition = GuiObject & {
	readonly Content: ScrollingFrame & NewSettingsScenes;
	readonly Heading: {
		readonly CloseButton: GuiButton;
		readonly TitleLabel: TextLabel;
	};
};

export type NewSettingsScenes = {
	readonly Main: Frame & {};
	readonly Permissions: Frame & {
		readonly Blacklist: PlayerSelectorColumnControlDefinition;
	};
};

type Scenes = keyof NewSettingsScenes;

export class NewSettingsPopup extends Popup<NewSettingsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Crossplatform: { Settings: NewSettingsPopupDefinition } } }>().Popup
			.Crossplatform.Settings;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	constructor(gui: NewSettingsPopupDefinition, startingScene?: Scenes) {
		super(gui);

		this.setScene(startingScene ?? "Permissions");

		this.add(new PlayerSelectorColumnControl(this.gui.Content.Permissions.Blacklist, []));

		this.add(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));
	}

	setScene(scene: Scenes) {
		this.gui.Heading.TitleLabel.Text = scene.upper();

		for (const scene of this.gui.Content.GetChildren()) {
			(scene as GuiObject).Visible = false;
		}

		this.gui.Content[scene].Visible = true;
	}
}
