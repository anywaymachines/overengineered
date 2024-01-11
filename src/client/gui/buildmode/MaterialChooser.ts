import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import Popup from "client/base/Popup";
import GuiController from "client/controller/GuiController";
import BuildingManager from "shared/building/BuildingManager";
import ObservableValue from "shared/event/ObservableValue";
import { TextButtonControl } from "../controls/Button";
import { DictionaryControl } from "../controls/DictionaryControl";
import NumberTextBoxControl from "../controls/NumberTextBoxControl";
import SliderControl, { SliderControlDefinition } from "../controls/SliderControl";
import { MaterialPreviewControl, MaterialPreviewDefinition } from "./MaterialPreviewControl";

type MaterialControlDefinition = GuiButton & {
	ViewportFrame: ViewportFrame & {
		Part: Part;
	};
	TextLabel: TextLabel;
};

/** Material viewer button */
class MaterialControl extends TextButtonControl<MaterialControlDefinition> {
	constructor(template: MaterialControlDefinition, material: Enum.Material) {
		super(template);

		this.text.set(material.Name);
		this.gui.ViewportFrame.Part.Material = material;
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
		this.add(this.list);

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
			const control = new MaterialControl(this.itemTemplate(), material);
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
	Hue: SliderControlDefinition & {
		UIGradient: UIGradient;
	};
	Saturation: SliderControlDefinition & {
		UIGradient: UIGradient;
	};
	Brightness: SliderControlDefinition & {
		UIGradient: UIGradient;
	};
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

		const createSlider = <T extends SliderControlDefinition>(gui: T, hsvIndex: number) => {
			const slider = new SliderControl(gui, 0, 1, 1 / 255);
			slider.value.set(this.selectedColor.get().ToHSV()[hsvIndex]);
			slider.value.subscribe((val) => {
				const hsv = this.selectedColor.get().ToHSV();
				hsv[hsvIndex] = val;

				this.selectedColor.set(Color3.fromHSV(hsv[0], hsv[1], hsv[2]));
			});
			this.add(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue, 0);
		const sat = createSlider(this.gui.Saturation, 1);
		const bri = createSlider(this.gui.Brightness, 2);

		for (const slider of [hue, sat, bri]) {
			slider.value.triggerChanged();
		}

		const r = new NumberTextBoxControl(this.gui.ManualRed, 0, 255, 1);
		this.add(r);
		this.event.subscribeObservable(r.value, (r) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(r / 255, color.G, color.B));
		});

		const g = new NumberTextBoxControl(this.gui.ManualGreen, 0, 255, 1);
		this.add(g);
		this.event.subscribeObservable(g.value, (g) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, g / 255, color.B));
		});

		const b = new NumberTextBoxControl(this.gui.ManualBlue, 0, 255, 1);
		this.add(b);
		this.event.subscribeObservable(b.value, (b) => {
			const color = this.selectedColor.get();
			this.selectedColor.set(new Color3(color.R, color.G, b / 255));
		});

		for (const text of [r, g, b]) {
			text.submitted.Connect(() => {
				[hue, sat, bri].map((slider, i) => slider.visualValue.set(this.selectedColor.get().ToHSV()[i]));
			});
		}

		this.event.subscribeObservable(
			this.selectedColor,
			(color) => {
				this.gui.Preview.BackgroundColor3 = this.selectedColor.get();

				const [h, s, v] = color.ToHSV();

				sat.getGui().UIGradient.Color = new ColorSequence(Color3.fromHSV(h, 0, v), Color3.fromHSV(h, 1, v));

				bri.getGui().UIGradient.Color = new ColorSequence(
					bri.getGui().UIGradient.Color.Keypoints[0].Value,
					Color3.fromHSV(h, s, 1),
				);

				r.value.set(math.floor(color.R * 255));
				g.value.set(math.floor(color.G * 255));
				b.value.set(math.floor(color.B * 255));
			},
			true,
		);
	}
}

export type MaterialChooserControlDefinition = GuiObject & {
	Body: GuiObject & {
		Body: MaterialChoosePartDefinition;
		Color: MaterialColorChooseDefinition;
		Preview: GuiObject & { MaterialPreviewFrame: MaterialPreviewDefinition };
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
	);

	public readonly selectedMaterial;
	public readonly selectedColor;
	private prevData: readonly [material: Enum.Material, color: Color3] | undefined;

	constructor(gui: MaterialChooserControlDefinition) {
		super(gui);

		const chooser = new MaterialChoosePart(gui.Body.Body, BuildingManager.AllowedMaterials);
		this.add(chooser);
		this.selectedMaterial = chooser.selectedMaterial;

		const color = new MaterialColorChooseControl(gui.Body.Color);
		this.add(color);
		this.selectedColor = color.selectedColor;

		const preview = new MaterialPreviewControl(
			gui.Body.Preview.MaterialPreviewFrame,
			this.selectedMaterial,
			this.selectedColor,
		);
		this.add(preview);

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
