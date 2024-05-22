import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";
import type { BoolConfigValueControl } from "client/gui/playerConfig/BoolConfigValueControl.client";

class CameraValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Camera["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Camera["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Camera>,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const def = {
			improved: {
				displayName: "Enable",
				type: "bool",
				config: definition.config.improved,
			},
			strictFollow: {
				displayName: "Strict Follow",
				type: "bool",
				config: definition.config.strictFollow,
			},
			playerCentered: {
				displayName: "Player Centered",
				type: "bool",
				config: definition.config.playerCentered,
			},
		} as const satisfies PlayerConfigTypes.Definitions;
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

		const control = this.add(new MultiPlayerConfigControl(this.gui.Control, config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});

		const improved = control.get("improved") as BoolConfigValueControl;
		const strictFollow = control.get("strictFollow") as BoolConfigValueControl;
		const playerCentered = control.get("playerCentered") as BoolConfigValueControl;

		const setImprovedControlsEnabled = (enabled: boolean) => {
			strictFollow.setVisible(enabled);
			playerCentered.setVisible(enabled);
		};
		this.event.subscribe(improved.submitted, setImprovedControlsEnabled);
		setImprovedControlsEnabled(config.improved);
	}
}

playerConfigControlRegistry.set("camera", CameraValueControl);
