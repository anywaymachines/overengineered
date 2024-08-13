import { ButtonControl } from "client/gui/controls/Button";
import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerSelectorColumnControlDefinition } from "client/gui/controls/PlayerSelectorListControl";
import type { SharedPlot } from "shared/building/SharedPlot";

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
		readonly IsolationMode: Frame & {
			readonly Toggle: TextButton & {
				readonly Circle: TextButton;
			};
		};
	};
};

type Scenes = keyof NewSettingsScenes;

@injectable
export class NewSettingsPopup extends Popup<NewSettingsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Crossplatform: { Settings: NewSettingsPopupDefinition } } }>().Popup
			.Crossplatform.Settings;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	constructor(gui: NewSettingsPopupDefinition, @inject plot: SharedPlot) {
		super(gui);
		this.setScene("Main");

		const blacklistedPlayers = plot.blacklistedPlayers.get() ?? [];
		const blacklist = new PlayerSelectorColumnControl(this.gui.Content.Permissions.Blacklist, blacklistedPlayers);
		const isolationMode = new ToggleControl(this.gui.Content.Permissions.IsolationMode.Toggle);
		isolationMode.value.set(plot.isolationMode.get() ?? false);

		blacklist.submitted.Connect((players) => {
			CustomRemotes.gui.settings.permissions.updateBlacklist.send(players);
		});

		isolationMode.value.changed.Connect((value) => {
			if (value) {
				blacklist.hide();
			} else {
				blacklist.show();
			}

			CustomRemotes.gui.settings.permissions.isolationMode.send(value);
		});

		this.add(blacklist);
		this.add(isolationMode);
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
