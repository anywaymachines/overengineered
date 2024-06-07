import { Control } from "client/gui/Control";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal, Signal } from "shared/event/Signal";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { ReadonlyArgsSignal } from "shared/event/Signal";

export type ColorChooserDefinition = GuiObject & {
	readonly Preview: GuiObject;
	readonly Sliders: GuiObject & {
		readonly Hue: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
		readonly Saturation: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
		readonly Brightness: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
	};
	readonly Inputs: GuiObject & {
		readonly ManualBlue: TextBox;
		readonly ManualRed: TextBox;
		readonly ManualGreen: TextBox;
		readonly ManualHex: TextBox;
	};
};

class ColorChooserSliders extends Control<ColorChooserDefinition["Sliders"]> {
	readonly submitted: ReadonlyArgsSignal<[color: Color3]>;
	readonly moved: ReadonlyArgsSignal<[color: Color3]>;
	private readonly sliders;

	constructor(gui: ColorChooserDefinition["Sliders"]) {
		super(gui);

		const submitted = new ArgsSignal<[color: Color3]>();
		this.submitted = submitted;

		const moved = new ArgsSignal<[color: Color3]>();
		this.moved = moved;

		const updateSliderColors = () => {
			const [h, s, v] = [hue.value.get(), sat.value.get(), bri.value.get()];

			gui.Saturation.UIGradient.Color = new ColorSequence(Color3.fromHSV(h, 0, v), Color3.fromHSV(h, 1, v));
			gui.Brightness.UIGradient.Color = new ColorSequence(
				gui.Brightness.UIGradient.Color.Keypoints[0].Value,
				Color3.fromHSV(h, s, 1),
			);
		};
		this.onEnable(updateSliderColors);

		const getColorFromSliders = () => Color3.fromHSV(hue.value.get(), sat.value.get(), bri.value.get());
		const createSlider = <T extends SliderControlDefinition>(gui: T) => {
			const slider = new SliderControl(gui, 0, 1, 1 / 255);
			slider.submitted.Connect(() => submitted.Fire(getColorFromSliders()));
			slider.moved.Connect(() => moved.Fire(getColorFromSliders()));
			slider.value.subscribe(updateSliderColors);
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue);
		const sat = createSlider(this.gui.Saturation);
		const bri = createSlider(this.gui.Brightness);
		this.sliders = { hue, sat, bri } as const;
	}

	set(value: Color3) {
		const [h, s, v] = value.ToHSV();

		this.sliders.hue.value.set(h);
		this.sliders.sat.value.set(s);
		this.sliders.bri.value.set(v);
	}
}
class ColorChooserInputs extends Control<ColorChooserDefinition["Inputs"]> {
	readonly submitted: ReadonlyArgsSignal<[color: Color3]>;
	private readonly texts;

	constructor(gui: ColorChooserDefinition["Inputs"]) {
		super(gui);

		const submitted = new ArgsSignal<[color: Color3]>();
		this.submitted = submitted;

		const getColorFromRgbTextBoxes = () => Color3.fromRGB(rtext.value.get(), gtext.value.get(), btext.value.get());
		const submitFromRgb = () => submitted.Fire(getColorFromRgbTextBoxes());

		const rtext = this.add(new NumberTextBoxControl(this.gui.ManualRed, 0, 255, 1));
		const gtext = this.add(new NumberTextBoxControl(this.gui.ManualGreen, 0, 255, 1));
		const btext = this.add(new NumberTextBoxControl(this.gui.ManualBlue, 0, 255, 1));

		this.event.subscribe(rtext.submitted, submitFromRgb);
		this.event.subscribe(gtext.submitted, submitFromRgb);
		this.event.subscribe(btext.submitted, submitFromRgb);

		const hextext = this.add(new TextBoxControl(this.gui.ManualHex));
		this.event.subscribe(hextext.submitted, (hex) => {
			if (hex.sub(1, 1) !== "#") {
				hextext.text.set("#" + hex);
				return;
			}

			try {
				submitted.Fire(Color3.fromHex(hex));
			} catch {
				hextext.text.set("#" + getColorFromRgbTextBoxes().ToHex().upper());
				return;
			}
		});

		this.texts = { rtext, gtext, btext, hextext } as const;
		submitted.Connect((color) => this.set(color));
	}

	set(color: Color3) {
		this.texts.rtext.value.set(math.floor(color.R * 255));
		this.texts.gtext.value.set(math.floor(color.G * 255));
		this.texts.btext.value.set(math.floor(color.B * 255));
		this.texts.hextext.text.set("#" + color.ToHex().upper());
	}
}

/** Color chooser, not an actual wheel */
export class ColorChooser extends Control<ColorChooserDefinition> {
	private readonly _submitted = new Signal<(color: Color3) => void>();
	readonly submitted = this._submitted.asReadonly();
	readonly value;

	private readonly sliders;
	private readonly inputs;

	constructor(gui: ColorChooserDefinition) {
		super(gui);

		const value = new ObservableValue<Color3>(new Color3(1, 1, 1));
		this.value = value.asReadonly();

		const sliders = this.add(new ColorChooserSliders(gui.Sliders));
		this.sliders = sliders;
		sliders.moved.Connect((v) => {
			value.set(v);
			inputs.set(v);
		});
		sliders.submitted.Connect((v) => {
			value.set(v);
			inputs.set(v);
			this._submitted.Fire(v);
		});

		const inputs = this.add(new ColorChooserInputs(gui.Inputs));
		this.inputs = inputs;
		inputs.submitted.Connect((v) => {
			value.set(v);
			sliders.set(v);
			this._submitted.Fire(v);
		});

		this.onEnable(() => {
			const v = this.value.get();

			sliders.set(v);
			inputs.set(v);
		});

		this.event.subscribeObservable(this.value, (color) => (this.gui.Preview.BackgroundColor3 = color), true);
	}

	set(color: Color3) {
		this.inputs.set(color);
		this.sliders.set(color);
	}
}
