import Control from "client/base/Control";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { DictionaryControl } from "../controls/DictionaryControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import NumberTextBoxControl from "../controls/NumberTextBoxControl";
import BuildingManager from "shared/building/BuildingManager";
import GuiController from "client/controller/GuiController";
import Signal from "@rbxts/signal";
import Popup from "client/base/Popup";

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
	CancelButton: GuiButton;
	ConfirmButton: GuiButton;
};

/** Material chooser part */
class MaterialChoosePart extends Control<MaterialChoosePartDefinition> {
	public readonly canceled = new Signal<() => void>();
	public readonly confirmed = new Signal<() => void>();
	public readonly selectedMaterial;

	private readonly materials;

	private readonly itemTemplate;
	private readonly list;

	constructor(gui: MaterialChoosePartDefinition, materials: readonly Enum.Material[]) {
		super(gui);

		this.materials = materials;
		this.selectedMaterial = new ObservableValue<Enum.Material>(materials[0]);

		this.list = new DictionaryControl<GuiObject, Enum.Material, MaterialControl>(this.gui.ScrollingFrame);
		this.add(this.list, false);

		const color = this.gui.ScrollingFrame.Template.BackgroundColor3;

		// Prepare templates
		this.itemTemplate = Control.asTemplate(this.gui.ScrollingFrame.Template);

		this.create();

		this.event.subscribeObservable(
			this.selectedMaterial,
			(material) => {
				for (const [_, child] of this.list.getKeyedChildren()) child.getGui().BackgroundColor3 = color;

				this.list.getKeyedChildren().get(material)!.getGui().BackgroundColor3 = color.Lerp(
					new Color3(1, 1, 1),
					0.3,
				);
			},
			true,
		);

		this.event.subscribe(this.gui.CancelButton.Activated, () => this.canceled.Fire());
		this.event.subscribe(this.gui.ConfirmButton.Activated, () => this.confirmed.Fire());
	}

	private create() {
		const createPart = (material: Enum.Material, activated: () => void) => {
			const control = new MaterialControl(this.itemTemplate(), material.Name);
			this.list.addKeyed(material, control);

			control.show();
			control.activated.Connect(activated);
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
class MaterialColorChooseControl extends Control<MaterialColorChooseDefinition> {
	public readonly selectedColor;

	constructor(gui: MaterialColorChooseDefinition) {
		super(gui);

		this.selectedColor = new ObservableValue<Color3>(new Color3(1, 1, 1));

		const updateColor = () => {
			this.selectedColor.set(Color3.fromHSV(hue.value.get(), sat.value.get(), 1 - bri.value.get()));
		};
		const createSlider = <T extends SliderControlDefinition>(gui: T, value: number) => {
			const slider = new SliderControl(gui);
			slider.setStep(1 / 255);
			slider.setMin(0);
			slider.setMax(1);
			slider.value.set(value);
			slider.value.subscribe(updateColor);
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue, this.selectedColor.get().ToHSV()[0]);
		const sat = createSlider(this.gui.Saturation, this.selectedColor.get().ToHSV()[1]);
		const bri = createSlider(this.gui.Brightness, this.selectedColor.get().ToHSV()[2]);

		const r = new NumberTextBoxControl(this.gui.ManualRed);
		this.add(r);
		this.event.subscribeObservable(r.value, (r) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(r / 255, color.G, color.B));
		});

		const g = new NumberTextBoxControl(this.gui.ManualGreen);
		this.add(g);
		this.event.subscribeObservable(g.value, (g) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, g / 255, color.B));
		});

		const b = new NumberTextBoxControl(this.gui.ManualBlue);
		this.add(b);
		this.event.subscribeObservable(b.value, (b) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, color.G, b / 255));
		});

		this.event.subscribeObservable(
			this.selectedColor,
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

export type MaterialPreviewDefinition = GuiObject & {
	MaterialPreviewFrame: ViewportFrame & {
		Part: Part;
	};
};
/** Material preview */
export class MaterialPreviewControl extends Control<MaterialPreviewDefinition> {
	constructor(
		gui: MaterialPreviewDefinition,
		selectedMaterial: ReadonlyObservableValue<Enum.Material>,
		selectedColor: ReadonlyObservableValue<Color3>,
	) {
		super(gui);

		this.event.subscribeObservable(
			selectedMaterial,
			(material) => (this.gui.MaterialPreviewFrame.Part.Material = material),
			true,
		);

		this.event.subscribeObservable(
			selectedColor,
			(color) => (this.gui.MaterialPreviewFrame.Part.Color = color),
			true,
		);
	}
}

export type MaterialChooserControlDefinition = GuiObject & {
	Body: GuiObject & {
		Body: MaterialChoosePartDefinition;
		Color: MaterialColorChooseDefinition;
		Preview: MaterialPreviewDefinition;
	};
};

/** Material choose & preview control */
export default class MaterialChooserControl extends Popup<MaterialChooserControlDefinition> {
	public static readonly instance = new MaterialChooserControl(
		GuiController.getGameUI<{
			Popup: {
				MaterialGui: MaterialChooserControlDefinition;
			};
		}>().Popup.MaterialGui,
		BuildingManager.AllowedMaterials,
	);

	public readonly selectedMaterial;
	public readonly selectedColor;
	private prevData: readonly [material: Enum.Material, color: Color3] | undefined;

	constructor(gui: MaterialChooserControlDefinition, materials: readonly Enum.Material[]) {
		super(gui);

		const chooser = new MaterialChoosePart(gui.Body.Body, materials);
		this.add(chooser, false);
		this.selectedMaterial = chooser.selectedMaterial;

		const color = new MaterialColorChooseControl(gui.Body.Color);
		this.add(color, false);
		this.selectedColor = color.selectedColor;

		const preview = new MaterialPreviewControl(gui.Body.Preview, this.selectedMaterial, this.selectedColor);
		this.add(preview, false);

		this.event.subscribe(chooser.canceled, () => {
			if (this.prevData) {
				this.selectedMaterial.set(this.prevData[0]);
				this.selectedColor.set(this.prevData[1]);
			}

			this.hide();
		});
		this.event.subscribe(chooser.confirmed, () => this.hide());
	}

	public show() {
		super.show();
		this.prevData = [this.selectedMaterial.get(), this.selectedColor.get()];
	}
	public hide() {
		super.hide();
		this.prevData = undefined;
	}
}
