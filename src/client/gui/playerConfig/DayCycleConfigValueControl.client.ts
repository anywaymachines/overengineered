import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";

@injectable
class DayCycleValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.DayCycle["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.DayCycle["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.DayCycle>,
		@inject di: DIContainer,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const def = {
			automatic: {
				displayName: "Automatic",
				type: "bool",
				config: true as boolean,
			},
			manual: {
				displayName: "Manual time (hours)",
				type: "clampedNumber",
				config: 0 as number,
				min: 0,
				max: 24,
				step: 0.1,
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

playerConfigControlRegistry.set("dayCycle", DayCycleValueControl);
