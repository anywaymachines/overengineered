import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";

@injectable
class BeaconsValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Beacons["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Beacons["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Beacons>,
		@inject di: DIContainer,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const def = {
			plot: {
				displayName: "Plot",
				type: "bool",
				config: true as boolean,
			},
			players: {
				displayName: "Players",
				type: "bool",
				config: false as boolean,
			},
		} as const satisfies PlayerConfigTypes.Definitions;
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

		const control = this.add(new MultiPlayerConfigControl(this.gui.Control, di));
		control.set(config, def);
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});
	}
}

playerConfigControlRegistry.set("beacons", BeaconsValueControl);
