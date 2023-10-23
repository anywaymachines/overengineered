import ToolsGui from "./ToolsGui";

export default class GuiController {
	public static TOOLS_GUI: ToolsGui;

	public static ininitalize() {
		this.TOOLS_GUI = new ToolsGui();
	}
}
