import { ButtonControl } from "client/gui/controls/Button";
import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { InstanceComponent } from "shared/component/InstanceComponent";
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

type ToggleRow = Frame & {
	readonly Toggle: TextButton & {
		readonly Circle: TextButton;
	};
};

type SliderRow = Frame & {
	readonly SliderControl: Frame & {
		readonly Filled: Frame;
		readonly Knob: Frame;
	};
	readonly ManualControl: TextBox;
};

export type NewSettingsScenes = {
	readonly Main: Frame & {};
	readonly Permissions: Frame & {
		readonly Blacklist: PlayerSelectorColumnControlDefinition;
		readonly IsolationMode: ToggleRow;
	};
	readonly Graphics: Frame & {
		readonly Effects: Frame & {
			readonly LocalShadows: ToggleRow;
			readonly OthersShadows: ToggleRow;
			readonly OthersEffects: ToggleRow;
		};
		readonly Camera: Frame & {
			readonly Improved: ToggleRow;
			readonly PlayerCentered: ToggleRow;
			readonly Strict: ToggleRow;
			readonly FieldOfView: SliderRow;
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

	private readonly sceneParent;

	constructor(
		gui: NewSettingsPopupDefinition,
		@inject private readonly plot: SharedPlot,
	) {
		super(gui);

		this.sceneParent = this.add(new InstanceComponent(this.gui));

		this.add(new ButtonControl(this.gui.Heading.CloseButton, () => this.hide()));
		this.setScene("Main");
	}

	loadScene(scene: Scenes) {
		this.sceneParent.clear();

		if (scene === "Main") {
			// TODO: make this scene
			return;
		}

		if (scene === "Permissions") {
			const blacklistedPlayers = this.plot.blacklistedPlayers.get() ?? [];
			const blacklist = new PlayerSelectorColumnControl(
				this.gui.Content.Permissions.Blacklist,
				blacklistedPlayers,
			);
			const isolationMode = new ToggleControl(this.gui.Content.Permissions.IsolationMode.Toggle);
			isolationMode.value.set(this.plot.isolationMode.get() ?? false);

			blacklist.submitted.Connect((players) => {
				CustomRemotes.gui.settings.permissions.updateBlacklist.send(players);
			});

			isolationMode.value.changed.Connect((value) => {
				blacklist.setVisible(!value);
				CustomRemotes.gui.settings.permissions.isolationMode.send(value);
			});

			this.sceneParent.add(blacklist);
			this.sceneParent.add(isolationMode);
			return;
		}

		if (scene === "Graphics") {
			// TODO: make this scene
			return;
		}
	}

	setScene(scene: Scenes) {
		this.gui.Heading.TitleLabel.Text = scene.upper();

		for (const scene of this.gui.Content.GetChildren()) {
			(scene as GuiObject).Visible = false;
		}

		this.gui.Content[scene].Visible = true;

		this.loadScene(scene);
	}
}
