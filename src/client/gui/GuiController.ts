import GuiUtils from "client/utils/GuiUtils";
import ToolsInterface from "./ToolsInterface";

export default class GuiController {
	public static TOOLS_GUI: ToolsInterface;

	public static ininitalize() {
		const gameUI = GuiUtils.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
		this.TOOLS_GUI = new ToolsInterface(gameUI);
	}
}
