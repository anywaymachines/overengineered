import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import MaterialColorEditControl, {
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import PaintTool from "client/tools/PaintTool";

export type PaintToolSceneDefinition = GuiObject & {
	readonly Bottom: MaterialColorEditControlDefinition & {
		readonly Material: {
			readonly SetMaterialsButton: ButtonDefinition;
			readonly Header: {
				readonly EnabledToggle: ToggleControlDefinition;
			};
		};
		readonly Color: {
			readonly SetColorsButton: ButtonDefinition;
			readonly Header: {
				readonly EnabledToggle: ToggleControlDefinition;
			};
		};
	};
	//readonly PaintEverythingButton: GuiButton;
};

export default class PaintToolScene extends Control<PaintToolSceneDefinition> {
	readonly tool;

	constructor(gui: PaintToolSceneDefinition, tool: PaintTool) {
		super(gui);
		this.tool = tool;

		this.add(
			new ButtonControl(this.gui.Bottom.Material.SetMaterialsButton, () => this.paintEverything(false, true)),
		);
		this.add(new ButtonControl(this.gui.Bottom.Color.SetColorsButton, () => this.paintEverything(true, false)));

		const enable = () => {
			// to not paint a block
			task.wait();

			this.tool.enable();
		};
		const disable = () => {
			this.tool.disable();
		};

		const materialColorEditor = this.add(
			new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor),
		);
		materialColorEditor.materialPipette.onStart.Connect(disable);
		materialColorEditor.materialPipette.onEnd.Connect(enable);
		materialColorEditor.colorPipette.onStart.Connect(disable);
		materialColorEditor.colorPipette.onEnd.Connect(enable);

		const materialEnabler = this.add(new ToggleControl(this.gui.Bottom.Material.Header.EnabledToggle));
		materialEnabler.value.set(tool.enableMaterial.get());
		this.event.subscribeObservable(materialEnabler.value, (value) => tool.enableMaterial.set(value));
		const colorEnabler = this.add(new ToggleControl(this.gui.Bottom.Color.Header.EnabledToggle));
		colorEnabler.value.set(tool.enableColor.get());
		this.event.subscribeObservable(colorEnabler.value, (value) => tool.enableColor.set(value));
	}

	private paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
		this.tool.paintEverything(enableColor, enableMaterial);
	}

	show() {
		super.show();

		GuiAnimator.transition(this.gui.Bottom, 0.2, "up");
		//GuiAnimator.transition(this.gui.PaintEverythingButton, 0.2, "up");
	}
}
