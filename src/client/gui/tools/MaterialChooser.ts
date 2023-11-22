import Control from "client/base/Control";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ListControl } from "../controls/ListControl";
import { DictionaryControl } from "../controls/DictionaryControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import NumberTextBoxControl from "../controls/NumberTextBoxControl";

type MaterialControlDefinition = GuiButton & {
	TextLabel: TextLabel;
};

/** Material viewer button */
class MaterialControl extends Control<MaterialControlDefinition> {
	public readonly activated;

	constructor(template: MaterialControlDefinition, text: string) {
		super(template);

		this.activated = this.gui.Activated;
		this.gui.TextLabel.Text = text;
	}
}

type MaterialChoosePartDefinition = GuiObject & {
	ScrollingFrame: ScrollingFrame & {
		Template: MaterialControlDefinition;
	};
};

/** Material chooser part */
class MaterialChoosePart extends Control<MaterialChoosePartDefinition> {
	public readonly selectedMaterial;

	private readonly materials;

	private readonly itemTemplate;
	private readonly list;

	constructor(gui: MaterialChoosePartDefinition, materials: readonly Enum.Material[]) {
		super(gui);

		this.materials = materials;
		this.selectedMaterial = new ObservableValue<Enum.Material>(materials[0]);

		this.list = new DictionaryControl<GuiObject, Enum.Material, MaterialControl>(this.gui.ScrollingFrame);

		const color = this.gui.ScrollingFrame.Template.BackgroundColor3;

		// Prepare templates
		this.itemTemplate = Control.asTemplate(this.gui.ScrollingFrame.Template);

		this.create();

		this.selectedMaterial.subscribe(
			this.eventHandler,
			(material) => {
				for (const [_, child] of this.list.getChildren()) child.getGui().BackgroundColor3 = color;

				this.list.getChildren().get(material)!.getGui().BackgroundColor3 = color.Lerp(new Color3(1, 1, 1), 0.3);
			},
			true,
		);
	}

	private create() {
		const createPart = (material: Enum.Material, activated: () => void) => {
			const control = new MaterialControl(this.itemTemplate(), material.Name);
			control.setVisible(true);
			control.activated.Connect(activated);

			this.list.add(material, control);
		};

		this.list.clear();

		this.materials.forEach((material) =>
			createPart(material, () => {
				this.selectedMaterial.set(material);
			}),
		);
	}
}

type MaterialColorChooseDefinition = GuiObject & {
	Preview: GuiObject & {};
	Hue: SliderControlDefinition;
	Saturation: SliderControlDefinition & {
		UIGradient: UIGradient;
	};
	Brightness: SliderControlDefinition;
	ManualBlue: TextBox;
	ManualRed: TextBox;
	ManualGreen: TextBox;
};
/** Material color chooser */
class MaterialColorChooseControl extends ListControl<MaterialColorChooseDefinition> {
	public readonly selectedColor;

	constructor(gui: MaterialColorChooseDefinition) {
		super(gui);

		this.selectedColor = new ObservableValue<Color3>(new Color3(159 / 255, 161 / 255, 172 / 255));

		const updateColor = () => {
			this.selectedColor.set(Color3.fromHSV(hue.value.get(), sat.value.get(), 1 - bri.value.get()));
		};
		const createSlider = <T extends SliderControlDefinition>(gui: T, value: number) => {
			const slider = new SliderControl(gui);
			slider.setStep(1 / 255);
			slider.setMin(0);
			slider.setMax(1);
			slider.value.set(value);
			slider.value.subscribe(this.eventHandler, updateColor);
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue, this.selectedColor.get().ToHSV()[0]);
		const sat = createSlider(this.gui.Saturation, this.selectedColor.get().ToHSV()[1]);
		const bri = createSlider(this.gui.Brightness, this.selectedColor.get().ToHSV()[2]);

		const r = new NumberTextBoxControl(this.gui.ManualRed);
		this.add(r);
		r.value.subscribe(this.eventHandler, (r) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(r / 255, color.G, color.B));
		});

		const g = new NumberTextBoxControl(this.gui.ManualGreen);
		this.add(g);
		g.value.subscribe(this.eventHandler, (g) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, g / 255, color.B));
		});

		const b = new NumberTextBoxControl(this.gui.ManualBlue);
		this.add(b);
		b.value.subscribe(this.eventHandler, (b) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, color.G, b / 255));
		});

		this.selectedColor.subscribe(
			this.eventHandler,
			() => {
				this.gui.Preview.BackgroundColor3 = this.selectedColor.get();

				sat.getGui().UIGradient.Color = new ColorSequence(
					sat.getGui().UIGradient.Color.Keypoints[0].Value,
					Color3.fromHSV(hue.value.get(), 1, 1 - bri.value.get()),
				);

				this.gui.ManualRed.Text = math.floor(this.selectedColor.get().R * 255) + "";
				this.gui.ManualGreen.Text = math.floor(this.selectedColor.get().G * 255) + "";
				this.gui.ManualBlue.Text = math.floor(this.selectedColor.get().B * 255) + "";
			},
			true,
		);
	}
}

type MaterialPreviewDefinition = GuiObject & {
	ViewportFrame: ViewportFrame & {
		Part: BasePart;
	};
};
/** Material preview */
class MaterialPreviewControl extends Control<MaterialPreviewDefinition> {
	constructor(
		gui: MaterialPreviewDefinition,
		selectedMaterial: ReadonlyObservableValue<Enum.Material>,
		selectedColor: ReadonlyObservableValue<Color3>,
	) {
		super(gui);

		selectedMaterial.subscribe(
			this.eventHandler,
			(material) => (this.gui.ViewportFrame.Part.Material = material),
			true,
		);

		selectedColor.subscribe(this.eventHandler, (color) => (this.gui.ViewportFrame.Part.Color = color), true);
	}
}

export type MaterialChooserControlDefinition = GuiObject & {
	Body: MaterialChoosePartDefinition;
	Color: MaterialColorChooseDefinition;
	Preview: MaterialPreviewDefinition;
};

/** Material choose & preview control */
export default class MaterialChooserControl extends ListControl<MaterialChooserControlDefinition> {
	public readonly selectedMaterial;
	public readonly selectedColor;

	constructor(gui: MaterialChooserControlDefinition, materials: readonly Enum.Material[]) {
		super(gui);

		const chooser = new MaterialChoosePart(gui.Body, materials);
		this.add(chooser);
		this.selectedMaterial = chooser.selectedMaterial;

		const color = new MaterialColorChooseControl(gui.Color);
		this.add(color);
		this.selectedColor = color.selectedColor;

		const preview = new MaterialPreviewControl(gui.Preview, this.selectedMaterial, this.selectedColor);
		this.add(preview);
	}
}
