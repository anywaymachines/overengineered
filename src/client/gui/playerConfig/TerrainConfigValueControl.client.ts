import { BoolConfigValueControl } from "client/gui/playerConfig/BoolConfigValueControl.client";
import { ClampedNumberConfigValueControl } from "client/gui/playerConfig/ClampedNumberConfigValueControl.client";
import { ConfigValueControl } from "client/gui/playerConfig/ConfigValueControl";
import { DropdownConfigValueControl } from "client/gui/playerConfig/DropdownConfigValueControl.client";
import { MultiPlayerConfigControl } from "client/gui/playerConfig/MultiConfigControl";
import { playerConfigControlRegistry } from "client/gui/playerConfig/PlayerConfigControlRegistry";
import { playerConfigValueTemplateStorage } from "client/gui/playerConfig/PlayerConfigValueTemplateStorage";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";

class TerrainValueControl extends ConfigValueControl<GuiObject> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Terrain["config"]) => void>();

	constructor(
		config: PlayerConfigTypes.Terrain["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Terrain>,
	) {
		super(playerConfigValueTemplateStorage.multi(), definition.displayName);

		const items: { readonly [k in typeof config.kind]: true } = {
			Flat: true,
			Terrain: true,
			Triangle: true,
			Water: true,
		};
		const def = {
			kind: {
				displayName: "Type",
				type: "dropdown",
				config: definition.config.kind,
				items: Objects.keys(items),
			},
			resolution: {
				displayName: "Resolution",
				type: "clampedNumber",
				config: definition.config.resolution,
				min: 1,
				max: 16,
				step: 1,
			},
			foliage: {
				displayName: "Foliage",
				type: "bool",
				config: true as boolean,
			},
			loadDistance: {
				displayName: "Load distance",
				type: "clampedNumber",
				config: 24 as number,
				min: 1,
				max: 96,
				step: 1,
			},
		} as const satisfies PlayerConfigTypes.Definitions;
		const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

		const control = this.add(new MultiPlayerConfigControl(this.gui.Control, config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});

		const resolutionControl = control.get("resolution") as ClampedNumberConfigValueControl;
		const foliageControl = control.get("foliage") as BoolConfigValueControl;
		const kindControl = control.get("kind") as DropdownConfigValueControl<typeof config.kind>;

		const setImprovedControlsEnabled = (kind: string & typeof config.kind) => {
			resolutionControl.setVisible(kind === "Triangle");
			foliageControl.setVisible(kind === "Terrain");
		};
		this.event.subscribe(kindControl.submitted, setImprovedControlsEnabled);
		setImprovedControlsEnabled(config.kind);
	}
}

playerConfigControlRegistry.set("terrain", TerrainValueControl);
