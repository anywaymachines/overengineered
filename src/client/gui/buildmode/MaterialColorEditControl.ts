import ColorWheel, { ColorWheelDefinition } from "client/gui/ColorWheel";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import MaterialChooser, { MaterialChooserDefinition } from "client/gui/MaterialChooser";
import { TextButtonControl } from "client/gui/controls/Button";
import ObservableValue from "shared/event/ObservableValue";

export type MaterialColorEditControlDefinition = GuiObject & {
	readonly Material: GuiObject & {
		readonly ScrollingFrame: MaterialChooserDefinition;
	};
	readonly Color: ColorWheelDefinition;
	readonly MaterialButton: TextButton;
	readonly ColorButton: TextButton;
};

/** Material preview with an edit button */
export default class MaterialColorEditControl extends Control<MaterialColorEditControlDefinition> {
	constructor(
		gui: MaterialColorEditControlDefinition,
		selectedMaterial: ObservableValue<Enum.Material>,
		selectedColor: ObservableValue<Color3>,
	) {
		super(gui);

		const materialGui = new Control(gui.Material);

		const material = this.add(new MaterialChooser(gui.Material.ScrollingFrame));
		const color = this.add(new ColorWheel(gui.Color));

		this.event.subscribeObservable(color.value, (value) => selectedColor.set(value));
		this.event.subscribeObservable(material.value, (value) => selectedMaterial.set(value));
		this.event.subscribeObservable(selectedColor, (value) => color.value.set(value));
		this.event.subscribeObservable(selectedMaterial, (value) => material.value.set(value));

		const materialbtn = this.add(new TextButtonControl(this.gui.MaterialButton));
		this.event.subscribe(materialbtn.activated, () => {
			if (materialGui.isVisible()) {
				GuiAnimator.revTransition(this.gui.Material, 0.05, "down", 20);
				materialGui.hide();
			} else {
				GuiAnimator.transition(this.gui.Material, 0.2, "up");
				materialGui.show();
			}
		});

		const colorbtn = this.add(new TextButtonControl(this.gui.ColorButton));
		this.event.subscribe(colorbtn.activated, () => {
			if (color.isVisible()) {
				GuiAnimator.revTransition(this.gui.Color, 0.05, "down", 20);
				color.hide();
			} else {
				GuiAnimator.transition(this.gui.Color, 0.2, "up");
				color.show();
			}
		});
	}
}
