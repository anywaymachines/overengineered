import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";

class GraphicsValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Graphics["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Graphics["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Graphics>,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const def = {
			localShadows: {
				displayName: "Local shadows",
				type: "bool",
				config: definition.config.localShadows,
			},
			othersShadows: {
				displayName: "Others shadows",
				type: "bool",
				config: definition.config.othersShadows,
			},
			othersEffects: {
				displayName: "Others effects and sounds",
				type: "bool",
				config: definition.config.othersEffects,
			},
		} as const satisfies PlayerConfigTypes.Definitions;
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

		const control = this.add(new MultiPlayerConfigControl(this.gui.Control, config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});
	}
}

playerConfigControlRegistry.set("graphics", GraphicsValueControl);
