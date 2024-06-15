import { Control } from "client/gui/Control";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { ArgsSignal } from "shared/event/Signal";
import { SubmittableValue } from "shared/event/SubmittableValue";
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
	private readonly _value = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
	readonly value = this._value.asHalfReadonly();
	readonly moved: ReadonlyArgsSignal<[color: Color3]>;
	private readonly sliders;
	private setBySelf = false;

	constructor(gui: ColorChooserDefinition["Sliders"]) {
		super(gui);

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
			slider.submitted.Connect(() => {
				this.setBySelf = true;
				this._value.submit(getColorFromSliders());
				this.setBySelf = false;
			});
			slider.moved.Connect(() => {
				this.setBySelf = true;
				moved.Fire(getColorFromSliders());
				this.setBySelf = false;
			});
			slider.value.subscribe(updateSliderColors);
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue);
		const sat = createSlider(this.gui.Saturation);
		const bri = createSlider(this.gui.Brightness);
		this.sliders = { hue, sat, bri } as const;

		this.event.subscribeObservable(
			this.value.value,
			(value) => {
				if (this.setBySelf) return;

				const [h, s, v] = value.ToHSV();
				this.sliders.hue.value.set(h);
				this.sliders.sat.value.set(s);
				this.sliders.bri.value.set(v);
			},
			true,
		);
	}
}
class ColorChooserInputs extends Control<ColorChooserDefinition["Inputs"]> {
	private readonly _value = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
	readonly value = this._value.asHalfReadonly();

	constructor(gui: ColorChooserDefinition["Inputs"]) {
		super(gui);

		const getColorFromRgbTextBoxes = () => Color3.fromRGB(rtext.value.get(), gtext.value.get(), btext.value.get());
		const submitFromRgb = () => this._value.submit(getColorFromRgbTextBoxes());

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
				this._value.submit(Color3.fromHex(hex));
			} catch {
				hextext.text.set("#" + getColorFromRgbTextBoxes().ToHex().upper());
				return;
			}
		});

		this.event.subscribeObservable(
			this.value.value,
			(value) => {
				rtext.value.set(math.floor(value.R * 255));
				gtext.value.set(math.floor(value.G * 255));
				btext.value.set(math.floor(value.B * 255));
				hextext.text.set("#" + value.ToHex().upper());
			},
			true,
		);
	}
}

/** Color chooser, not an actual wheel */
export class ColorChooser extends Control<ColorChooserDefinition> {
	readonly value;

	constructor(gui: ColorChooserDefinition, value?: SubmittableValue<Color3>) {
		super(gui);

		value ??= SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
		this.value = value.asHalfReadonly();

		const sliders = this.add(new ColorChooserSliders(gui.Sliders));
		sliders.moved.Connect((v) => {
			value.set(v);
			inputs.value.set(v);
		});
		sliders.value.submitted.Connect((v) => {
			value.set(v);
			inputs.value.set(v);
			value.submit(v);
		});

		const inputs = this.add(new ColorChooserInputs(gui.Inputs));
		inputs.value.submitted.Connect((v) => {
			value.set(v);
			sliders.value.set(v);
			value.submit(v);
		});

		this.event.subscribeObservable(
			value.value,
			(color) => {
				this.gui.Preview.BackgroundColor3 = color;

				inputs.value.set(color);
				sliders.value.set(color);
			},
			true,
		);
	}
}
