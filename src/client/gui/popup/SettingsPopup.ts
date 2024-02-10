import Signal from "@rbxts/signal";
import PlayerDataStorage from "client/PlayerDataStorage";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import Popup from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "client/gui/controls/SliderControl";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import Objects from "shared/fixes/objects";

export type Templates = {
	toggle: () => ConfigPartDefinition<ToggleControlDefinition>;
	number: () => ConfigPartDefinition<NumberTextBoxControlDefinition>;
	slider: () => ConfigPartDefinition<SliderControlDefinition>;
	multi: () => ConfigPartDefinition<MultiTemplate>;
};

type Template = {
	readonly ToggleTemplate: ConfigPartDefinition<ToggleControlDefinition>;
	readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
	readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
	readonly MultiTemplate: ConfigPartDefinition<MultiTemplate>;
};

type ConfigControlDefinition = GuiObject;
class ConfigControl<TDef extends PlayerConfigTypes.Definitions> extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(key: keyof TDef, value: PlayerConfigTypes.Types[keyof PlayerConfigTypes.Types]["config"]) => void
	>();

	private readonly toggleTemplate;
	private readonly numberTemplate;
	private readonly sliderTemplate;
	private readonly dayCycleTemplate;

	constructor(gui: ConfigControlDefinition);
	constructor(gui: ConfigControlDefinition, config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef);
	constructor(gui: ConfigControlDefinition, config?: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition?: TDef) {
		super(gui);

		const templates = Gui.getGameUI<{ Templates: { PlayerConfig: Template } }>().Templates.PlayerConfig;
		this.toggleTemplate = Control.asTemplate(templates.ToggleTemplate, false);
		this.numberTemplate = Control.asTemplate(templates.NumberTemplate, false);
		this.sliderTemplate = Control.asTemplate(templates.SliderTemplate, false);
		this.dayCycleTemplate = Control.asTemplate(templates.MultiTemplate, false);

		if (config && definition) {
			this.set(config, definition);
		}
	}

	set(config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef) {
		this.clear();

		for (const [id, def] of Objects.pairs(definition)) {
			const control = new configControls[def.type](
				{
					toggle: this.toggleTemplate,
					number: this.numberTemplate,
					slider: this.sliderTemplate,
					multi: this.dayCycleTemplate,
				},
				config[id] as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value));
		}
	}
}

export abstract class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}

	protected sameOrUndefined<T>(configs: readonly T[]) {
		let value: T | undefined;
		for (const config of configs) {
			if (value !== undefined && value !== config) {
				value = undefined;
				break;
			}

			value = config;
		}

		return value;
	}
}

//

export class BoolConfigValueControl extends ConfigValueControl<ToggleControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Bool["config"]) => void>();

	constructor(
		templates: Templates,
		config: PlayerConfigTypes.Bool["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Bool>,
	) {
		super(templates.toggle(), definition.displayName);

		const control = this.add(new ToggleControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

export class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Number["config"]) => void>();

	constructor(
		templates: Templates,
		config: PlayerConfigTypes.Number["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Number>,
	) {
		super(templates.number(), definition.displayName);

		const control = this.add(new NumberTextBoxControl(this.gui.Control));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

export class ClampedNumberConfigValueControl extends ConfigValueControl<SliderControlDefinition> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.ClampedNumber["config"]) => void>();

	constructor(
		templates: Templates,
		config: PlayerConfigTypes.ClampedNumber["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.ClampedNumber>,
	) {
		super(templates.slider(), definition.displayName);

		const control = this.add(new SliderControl(this.gui.Control, definition.min, definition.max, definition.step));
		control.value.set(config);

		this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
	}
}

type MultiTemplate = GuiObject & {};
export class DayCycleValueControl extends ConfigValueControl<MultiTemplate> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.DayCycle["config"]) => void>();

	constructor(
		templates: Templates,
		config: PlayerConfigTypes.DayCycle["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.DayCycle>,
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

		const control = this.add(new ConfigControl(this.gui.Control, config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});
	}
}

export class BeaconsValueControl extends ConfigValueControl<MultiTemplate> {
	readonly submitted = new Signal<(config: PlayerConfigTypes.Beacons["config"]) => void>();

	constructor(
		templates: Templates,
		config: PlayerConfigTypes.Beacons["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Beacons>,
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

		const control = this.add(new ConfigControl(this.gui.Control, config, def));
		this.event.subscribe(control.configUpdated, (key, value) => {
			this.submitted.Fire((config = { ...config, [key]: value }));
		});
	}
}

//

export const configControls = {
	bool: BoolConfigValueControl,
	number: NumberConfigValueControl,
	clampedNumber: ClampedNumberConfigValueControl,
	dayCycle: DayCycleValueControl,
	beacons: BeaconsValueControl,
} as const satisfies {
	readonly [k in keyof PlayerConfigTypes.Types]: {
		new (
			templates: Templates,
			config: PlayerConfigTypes.Types[k]["config"] & defined,
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Types[k]>,
		): ConfigValueControl<GuiObject> & {
			submitted: Signal<(value: PlayerConfigTypes.Types[k]["config"]) => void>;
		};
	};
};

//

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

export default class SettingsPopup extends Popup<SettingsPopupDefinition> {
	private readonly config;

	static showPopup() {
		const popup = new SettingsPopup(
			Gui.getGameUI<{
				Popup: {
					Settings: SettingsPopupDefinition;
				};
			}>().Popup.Settings.Clone(),
		);

		popup.show();
	}
	constructor(gui: SettingsPopupDefinition) {
		super(gui);

		this.config = this.add(new ConfigControl<PlayerConfigDefinition>(this.gui.Content.ScrollingFrame));

		this.event.subscribe(this.config.configUpdated, async (key, value) => {
			await PlayerDataStorage.sendPlayerConfigValue(key, value as PlayerConfig[keyof PlayerConfig]);
		});

		this.add(new ButtonControl(this.gui.Buttons.CancelButton, () => this.hide()));
		this.add(new ButtonControl(this.gui.Head.CloseButton, () => this.hide()));

		this.event.subscribeObservable(
			PlayerDataStorage.config,
			(config) => {
				if (!config) return;
				this.config.set(PlayerDataStorage.config.get(), PlayerConfigDefinition);
			},
			true,
		);
	}
}
