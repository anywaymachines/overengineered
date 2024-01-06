import Control from "client/base/Control";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";

export type MaterialPreviewDefinition = ViewportFrame & {
	Part: Part;
};

/** Material preview, as a ViewportFrame */
export class MaterialPreviewControl extends Control<MaterialPreviewDefinition> {
	constructor(
		gui: MaterialPreviewDefinition,
		selectedMaterial: ReadonlyObservableValue<Enum.Material>,
		selectedColor: ReadonlyObservableValue<Color3>,
	) {
		super(gui);
		this.event.subscribeObservable(selectedMaterial, (material) => (this.gui.Part.Material = material), true);
		this.event.subscribeObservable(selectedColor, (color) => (this.gui.Part.Color = color), true);
	}
}
