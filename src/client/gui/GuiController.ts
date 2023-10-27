import GuiUtils from "client/utils/GuiUtils";
import ToolsInterface from "./tool/ToolsInterface";
import { RunService, UserInputService } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";

export default class GuiController {
	public static TOOLS_GUI: ToolsInterface;

	public static controlChangedEvent = UserInputService.InputChanged.Connect((input, _) => this.onControlChanged());

	public static onControlChanged() {
		if (!(RunService.IsStudio() && GameDefinitions.DEBUG_TEST_ADAPTIVE_CONTROLS)) {
			return;
		}
		this.TOOLS_GUI.onControlChanged();
	}

	public static ininitalize() {
		const gameUI = GuiUtils.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
		this.TOOLS_GUI = new ToolsInterface(gameUI);
	}
}
