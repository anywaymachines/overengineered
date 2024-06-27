import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Gui } from "client/gui/Gui";
import { TutorialBasics } from "client/tutorial/TutorialBasics";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import type { Tutorial } from "client/tutorial/Tutorial";
import type { ReadonlyArgsSignal } from "shared/event/Signal";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};
class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}

const templatesFolder = Gui.getGameUI<{
	readonly Templates: {
		readonly PlayerConfig: {
			readonly ToggleTemplate: ConfigPartDefinition<ToggleControlDefinition>;
			readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
			readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
			readonly MultiTemplate: ConfigPartDefinition<GuiObject>;
			readonly DropdownTemplate: ConfigPartDefinition<DropdownListDefinition>;
			readonly KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
		};
	};
}>().Templates.PlayerConfig;
const templates = {
	toggle: Control.asTemplateWithMemoryLeak(templatesFolder.ToggleTemplate, false),
	number: Control.asTemplateWithMemoryLeak(templatesFolder.NumberTemplate, false),
	slider: Control.asTemplateWithMemoryLeak(templatesFolder.SliderTemplate, false),
	multi: Control.asTemplateWithMemoryLeak(templatesFolder.MultiTemplate, false),
	dropdown: Control.asTemplateWithMemoryLeak(templatesFolder.DropdownTemplate, false),
	key: Control.asTemplateWithMemoryLeak(templatesFolder.KeyTemplate, false),
} as const;

namespace ControlsSource {
	export class bool extends ConfigValueControl<ToggleControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Bool["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Bool["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Bool>,
		) {
			super(templates.toggle(), definition.displayName);

			const control = this.add(new ToggleControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class beacons extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Beacons["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Beacons["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Beacons>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

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

	@injectable
	export class camera extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Camera["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Camera["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Camera>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				improved: {
					displayName: "Improved",
					type: "bool",
					config: definition.config.improved,
				},
				strictFollow: {
					displayName: "Strict Following",
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

			const control = this.add(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const improved = control.get("improved");
			const strictFollow = control.get("strictFollow");
			const playerCentered = control.get("playerCentered");

			const setImprovedControlsEnabled = (enabled: boolean) => {
				strictFollow.setVisible(enabled);
				playerCentered.setVisible(enabled);
			};
			this.event.subscribe(improved.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.improved);
		}
	}

	export class clampedNumber extends ConfigValueControl<SliderControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.ClampedNumber["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.ClampedNumber["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.ClampedNumber>,
		) {
			super(templates.slider(), definition.displayName);

			const control = this.add(
				new SliderControl(this.gui.Control, definition.min, definition.max, definition.step),
			);
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class dayCycle extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.DayCycle["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.DayCycle["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.DayCycle>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

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

	export class dropdown<T extends string = string> extends ConfigValueControl<DropdownListDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Dropdown<T>["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Dropdown<T>["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Dropdown<T>>,
		) {
			super(templates.dropdown(), definition.displayName);

			const control = this.add(new DropdownList<T>(this.gui.Control, "down"));
			for (const item of definition.items) {
				control.addItem(item);
			}
			control.selectedItem.set(config);

			this.event.subscribeObservable(
				control.selectedItem,
				(value) => value !== undefined && this.submitted.Fire(value),
			);
		}
	}

	@injectable
	export class graphics extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Graphics["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Graphics["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Graphics>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				localShadows: {
					displayName: "Local shadows",
					type: "bool",
					config: definition.config.localShadows,
				},
				othersShadows: {
					displayName: "Other's shadows",
					type: "bool",
					config: definition.config.othersShadows,
				},
				othersEffects: {
					displayName: "Other's effects and sounds",
					type: "bool",
					config: definition.config.othersEffects,
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

	export class key extends ConfigValueControl<KeyChooserControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Key["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Key["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Key>,
		) {
			super(templates.key(), definition.displayName);

			const control = this.add(new KeyChooserControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	export class _number extends ConfigValueControl<NumberTextBoxControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Number["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Number["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Number>,
		) {
			super(templates.number(), definition.displayName);

			const control = this.add(new NumberTextBoxControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class terrain extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Terrain["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Terrain["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Terrain>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

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

			const control = this.add(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const resolutionControl = control.get("resolution");
			const foliageControl = control.get("foliage");
			const kindControl = control.get("kind") as dropdown<typeof config.kind>;

			const setImprovedControlsEnabled = (kind: string & typeof config.kind) => {
				resolutionControl.setVisible(kind === "Triangle");
				foliageControl.setVisible(kind === "Terrain");
			};
			this.event.subscribe(kindControl.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.kind);
		}
	}

	@injectable
	export class tutorial extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Tutorial["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Tutorial["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Tutorial>,
			@inject tutorial: Tutorial,
		) {
			super(templates.multi(), definition.displayName);

			const list = this.add(new Control(this.gui.Control));

			const basics = list.add(
				new TextButtonControl(
					Gui.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
					() => TutorialBasics(tutorial),
				),
			);
			basics.text.set("Basics tutorial");
		}
	}

	@injectable
	export class ragdoll extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Ragdoll["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Ragdoll["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Ragdoll>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				autoFall: {
					displayName: "Automatic triggering",
					type: "bool",
					config: definition.config.autoFall,
				},
				triggerByKey: {
					displayName: "Trigger on keypress",
					type: "bool",
					config: definition.config.triggerByKey,
				},
				triggerKey: {
					displayName: "Trigger key",
					type: "key",
					config: definition.config.triggerKey,
				},
				autoRecovery: {
					displayName: "Automatic recovery",
					type: "bool",
					config: definition.config.autoRecovery,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.add(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const byKeyControl = control.get("triggerByKey");
			const keyControl = control.get("triggerKey");

			const setImprovedControlsEnabled = (byKey: boolean) => keyControl.setVisible(byKey);
			this.event.subscribe(byKeyControl.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.triggerByKey);
		}
	}
}
const Controls = {
	...ControlsSource,
	number: ControlsSource._number,
} as const satisfies {
	readonly [k in keyof PlayerConfigTypes.Types]: new (
		config: PlayerConfigTypes.Types[k]["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Types[k]>,
		...rest: never
	) => ConfigControl<k>;
};

interface ConfigControl<TKey extends keyof PlayerConfigTypes.Types> extends Control<GuiObject> {
	readonly submitted: ReadonlyArgsSignal<[config: PlayerConfigTypes.Types[TKey]["config"]]>;
}

type ConfigControlDefinition = GuiObject;
@injectable
export class MultiPlayerConfigControl<
	TDef extends PlayerConfigTypes.Definitions,
> extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(key: keyof TDef, value: PlayerConfigTypes.Types[TDef[keyof TDef]["type"]]["config"]) => void
	>();

	private settedElements = new Map<keyof TDef, ConfigControl<keyof PlayerConfigTypes.Types>>();

	constructor(
		gui: ConfigControlDefinition,
		@inject private readonly di: DIContainer,
	) {
		super(gui);
	}

	get<TKey extends keyof TDef>(key: TKey): ConfigControl<TDef[TKey]["type"]> {
		return this.settedElements.get(key)!;
	}
	set(config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef) {
		this.clear();
		this.settedElements.clear();

		for (const [id, def] of Objects.entriesArray(definition).sort(
			(left, right) => tostring(left[0]) < tostring(right[0]),
		)) {
			const control = this.di.resolveForeignClass(Controls[def.type], [config[id], def] as never);
			this.add(control);
			this.settedElements.set(id, control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value as never));
		}
	}
}
