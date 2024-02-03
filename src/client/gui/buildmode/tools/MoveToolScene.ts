import { Players } from "@rbxts/services";
import Control from "client/gui/Control";
import MoveTool from "client/tools/MoveTool";
import SharedPlots from "shared/building/SharedPlots";
import GuiAnimator from "../../GuiAnimator";
import { ButtonControl } from "../../controls/Button";

export type MoveToolSceneDefinition = GuiObject & {
	readonly SelectEverythingButton: GuiButton;
};

export default class MoveToolScene extends Control<MoveToolSceneDefinition> {
	readonly tool;

	constructor(gui: MoveToolSceneDefinition, tool: MoveTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.SelectEverythingButton, () => this.selectEverything()));
	}

	private selectEverything() {
		this.tool.selectPlot(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.SelectEverythingButton, 0.2, "right");
	}
}
