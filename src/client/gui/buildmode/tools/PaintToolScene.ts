import { Control } from "client/gui/Control";
import {
	MaterialColorEditControl,
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import { ButtonControl, ButtonDefinition } from "client/gui/controls/Button";
import { ToggleControl, ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import { PaintTool } from "client/tools/PaintTool";
import { TransformService } from "shared/component/TransformService";

export type PaintToolSceneDefinition = GuiObject & {
	readonly Bottom: MaterialColorEditControlDefinition & {
		readonly Material: {
			readonly Header: {
				readonly EnabledToggle: ToggleControlDefinition;
			};
		};
		readonly Color: {
			readonly Header: {
				readonly EnabledToggle: ToggleControlDefinition;
			};
		};
	};
	readonly Top: GuiObject & {
		readonly SetMaterialsButton: ButtonDefinition;
		readonly SetColorsButton: ButtonDefinition;
	};
};

export class PaintToolScene extends Control<PaintToolSceneDefinition> {
	readonly tool;

	constructor(gui: PaintToolSceneDefinition, tool: PaintTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.Top.SetMaterialsButton, () => this.paintEverything(false, true)));
		this.add(new ButtonControl(this.gui.Top.SetColorsButton, () => this.paintEverything(true, false)));

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

	private readonly visibilityStateMachine = TransformService.multi(
		TransformService.boolStateMachine(
			this.gui.Top,
			TransformService.commonProps.quadOut02,
			{ AnchorPoint: this.gui.Top.AnchorPoint },
			{ AnchorPoint: new Vector2(0.5, 1) },
		),
		TransformService.boolStateMachine(
			this.gui.Bottom,
			TransformService.commonProps.quadOut02,
			{ Position: this.gui.Bottom.Position },
			{ Position: this.gui.Bottom.Position.add(new UDim2(0, 0, 0, 40)) },
			(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
			(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
		),
	);
	protected setInstanceVisibilityFunction(visible: boolean): void {
		this.visibilityStateMachine(visible);
	}
}
