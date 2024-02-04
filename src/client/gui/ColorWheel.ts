import Control from "client/gui/Control";
import NumberTextBoxControl from "client/gui/controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "client/gui/controls/SliderControl";
import TextBoxControl from "client/gui/controls/TextBoxControl";
import ObservableValue from "shared/event/ObservableValue";

export type ColorWheelDefinition = GuiObject & {
	readonly Preview: GuiObject;
	readonly Hue: SliderControlDefinition & {
		readonly UIGradient: UIGradient;
	};
	readonly Saturation: SliderControlDefinition & {
		readonly UIGradient: UIGradient;
	};
	readonly Brightness: SliderControlDefinition & {
		readonly UIGradient: UIGradient;
	};
	readonly ManualBlue: TextBox;
	readonly ManualRed: TextBox;
	readonly ManualGreen: TextBox;
	readonly ManualHex: TextBox;
};

/** Color chooser, not an actual wheel */
export default class ColorWheel extends Control<ColorWheelDefinition> {
	readonly value = new ObservableValue<Color3>(new Color3(1, 1, 1));

	constructor(gui: ColorWheelDefinition) {
		super(gui);

		let settingBySlider = false;
		const createSlider = <T extends SliderControlDefinition>(gui: T, hsvIndex: number) => {
			const slider = new SliderControl(gui, 0, 1, 1 / 255);
			slider.value.set(this.value.get().ToHSV()[hsvIndex]);
			slider.value.subscribe(() => {
				if (settingBySlider) return;

				settingBySlider = true;
				this.value.set(Color3.fromHSV(hue.value.get(), sat.value.get(), bri.value.get()));
				settingBySlider = false;
			});
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue, 0);
		const sat = createSlider(this.gui.Saturation, 1);
		const bri = createSlider(this.gui.Brightness, 2);

		this.event.subscribeObservable(
			this.value,
			(color) => {
				if (settingBySlider) return;

				const [h, s, v] = color.ToHSV();
				hue.value.set(h);
				sat.value.set(s);
				bri.value.set(v);
			},
			true,
		);

		const updateColorBySlider = (h: number | undefined, s: number | undefined, v: number | undefined) => {
			h ??= hue.value.get();
			s ??= sat.value.get();
			v ??= bri.value.get();

			sat.getGui().UIGradient.Color = new ColorSequence(Color3.fromHSV(h, 0, v), Color3.fromHSV(h, 1, v));
			bri.getGui().UIGradient.Color = new ColorSequence(
				bri.getGui().UIGradient.Color.Keypoints[0].Value,
				Color3.fromHSV(h, s, 1),
			);
		};
		hue.value.subscribe((h) => updateColorBySlider(h, undefined, undefined), true);
		sat.value.subscribe((s) => updateColorBySlider(undefined, s, undefined), true);
		bri.value.subscribe((v) => updateColorBySlider(undefined, undefined, v), true);

		const rtext = this.add(new NumberTextBoxControl(this.gui.ManualRed, 0, 255, 1));
		this.event.subscribeObservable(rtext.value, (r) => {
			const color = this.value.get();
			this.value.set(new Color3(r / 255, color.G, color.B));
		});

		const gtext = this.add(new NumberTextBoxControl(this.gui.ManualGreen, 0, 255, 1));
		this.event.subscribeObservable(gtext.value, (g) => {
			const color = this.value.get();
			this.value.set(new Color3(color.R, g / 255, color.B));
		});

		const btext = this.add(new NumberTextBoxControl(this.gui.ManualBlue, 0, 255, 1));
		this.event.subscribeObservable(btext.value, (b) => {
			const color = this.value.get();
			this.value.set(new Color3(color.R, color.G, b / 255));
		});

		const hextext = this.add(new TextBoxControl(this.gui.ManualHex));
		this.event.subscribeObservable(hextext.text, (hex) => {
			if (hex.sub(1, 1) !== "#") {
				hextext.text.set("#" + hex);
				return;
			}

			try {
				this.value.set(Color3.fromHex(hex));
			} catch {
				hextext.text.set("#" + this.value.get().ToHex().upper());
			}
		});

		this.event.subscribeObservable(
			this.value,
			(color) => {
				this.gui.Preview.BackgroundColor3 = this.value.get();

				rtext.value.set(math.floor(color.R * 255));
				gtext.value.set(math.floor(color.G * 255));
				btext.value.set(math.floor(color.B * 255));
				hextext.text.set("#" + this.value.get().ToHex().upper());
			},
			true,
		);
	}
}
