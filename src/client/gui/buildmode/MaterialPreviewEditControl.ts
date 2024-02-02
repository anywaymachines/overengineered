import Control from "client/gui/Control";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import { ButtonControl } from "../controls/Button";
import MaterialChooserControl from "./MaterialChooser";
import { MaterialPreviewControl, MaterialPreviewDefinition } from "./MaterialPreviewControl";

export type MaterialPreviewEditDefinition = GuiObject & {
	MaterialPreviewFrame: MaterialPreviewDefinition;
	EditMaterialButton: GuiButton;
};

/** Material preview with an edit button */
export class MaterialPreviewEditControl extends Control<MaterialPreviewEditDefinition> {
	constructor(
		gui: MaterialPreviewEditDefinition,
		selectedMaterial: ReadonlyObservableValue<Enum.Material>,
		selectedColor: ReadonlyObservableValue<Color3>,
	) {
		super(gui);

		this.add(new MaterialPreviewControl(gui.MaterialPreviewFrame, selectedMaterial, selectedColor));
		this.add(new ButtonControl(gui.EditMaterialButton, () => MaterialChooserControl.instance.show()));
	}
}
