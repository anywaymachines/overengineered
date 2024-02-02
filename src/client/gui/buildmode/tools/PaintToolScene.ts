import { Players } from "@rbxts/services";
import Control from "client/gui/Control";
import ToggleControl, { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import PaintTool from "client/tools/PaintTool";
import SharedPlots from "shared/building/SharedPlots";
import GuiAnimator from "../../GuiAnimator";
import { ButtonControl } from "../../controls/Button";
import MaterialChooserControl from "../MaterialChooser";
import { MaterialPreviewEditControl, MaterialPreviewEditDefinition } from "../MaterialPreviewEditControl";

export type PaintToolSceneDefinition = GuiObject & {
	readonly PaintEverythingButton: GuiButton;
	readonly Material: MaterialPreviewEditDefinition;
	readonly EnableMaterial: Frame & {
		readonly Toggle: ToggleControlDefinition;
	};
	readonly EnableColor: Frame & {
		readonly Toggle: ToggleControlDefinition;
	};
};

export default class PaintToolScene extends Control<PaintToolSceneDefinition> {
	readonly tool;

	constructor(gui: PaintToolSceneDefinition, tool: PaintTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.PaintEverythingButton, () => this.paintEverything()));
		this.add(new MaterialPreviewEditControl(this.gui.Material, tool.selectedMaterial, tool.selectedColor));

		const materialEnabler = this.add(new ToggleControl(this.gui.EnableMaterial.Toggle));
		materialEnabler.value.set(tool.enableMaterial.get());
		this.event.subscribeObservable(materialEnabler.value, (value) => tool.enableMaterial.set(value));
		const colorEnabler = this.add(new ToggleControl(this.gui.EnableColor.Toggle));
		colorEnabler.value.set(tool.enableColor.get());
		this.event.subscribeObservable(colorEnabler.value, (value) => tool.enableColor.set(value));

		MaterialChooserControl.instance.selectedMaterial.bindTo(tool.selectedMaterial);
		MaterialChooserControl.instance.selectedColor.bindTo(tool.selectedColor);
	}

	private paintEverything() {
		let plot: PlotModel | undefined;

		if (Players.LocalPlayer.Character) {
			plot = SharedPlots.getPlotByPosition(Players.LocalPlayer.Character.GetPivot().Position);
		}

		if (!plot || SharedPlots.isBuildingAllowed(plot, Players.LocalPlayer)) {
			plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
		}

		this.tool.paintEverything(plot);
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.Material, 0.2, "right");
		GuiAnimator.transition(this.gui.PaintEverythingButton, 0.2, "right");
	}
}
