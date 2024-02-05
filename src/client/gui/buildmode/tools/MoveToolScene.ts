import { Players } from "@rbxts/services";
import Control from "client/gui/Control";
import MoveTool from "client/tools/MoveTool";
import SharedPlots from "shared/building/SharedPlots";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl } from "client/gui/controls/Button";

export type MoveToolSceneDefinition = GuiObject & {
	readonly Bottom: {
		readonly SelectAllButton: GuiButton;
	};
};

export default class MoveToolScene extends Control<MoveToolSceneDefinition> {
	readonly tool;

	constructor(gui: MoveToolSceneDefinition, tool: MoveTool) {
		super(gui);
		this.tool = tool;

		this.add(new ButtonControl(this.gui.Bottom.SelectAllButton, () => this.selectEverything()));
	}

	private selectEverything() {
		this.tool.selectPlot(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId));
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.Bottom.SelectAllButton, 0.2, "right");
	}
}
