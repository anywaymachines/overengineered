import { Players } from "@rbxts/services";
import Control from "client/base/Control";
import PaintTool from "client/tools/PaintTool";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import GuiAnimator from "../../GuiAnimator";
import { ButtonControl } from "../../controls/Button";
import MaterialChooserControl from "../MaterialChooser";
import { MaterialPreviewEditControl, MaterialPreviewEditDefinition } from "../MaterialPreviewEditControl";

export type PaintToolSceneDefinition = GuiObject & {
	PaintEverythingButton: GuiButton;
	Material: MaterialPreviewEditDefinition;
};

export default class PaintToolScene extends Control<PaintToolSceneDefinition> {
	readonly tool;

	constructor(gui: PaintToolSceneDefinition, tool: PaintTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.PaintEverythingButton, () => this.paintEverything()));
		this.add(new MaterialPreviewEditControl(this.gui.Material, tool.selectedMaterial, tool.selectedColor));

		MaterialChooserControl.instance.selectedMaterial.bindTo(tool.selectedMaterial);
		MaterialChooserControl.instance.selectedColor.bindTo(tool.selectedColor);
	}

	private paintEverything() {
		let plot: PlotModel | undefined;

		if (Players.LocalPlayer.Character) {
			plot = SharedPlots.getPlotByPosition(Players.LocalPlayer.Character.GetPivot().Position);
		}

		if (!plot || BuildingManager.isBuildingAllowed(plot, Players.LocalPlayer)) {
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
