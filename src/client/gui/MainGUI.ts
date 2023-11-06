import GuiUtils from "client/utils/GuiUtils";
import HotbarGUI from "./HotbarGUI";
import InputTooltipsGUI from "./InputTooltipsGUI";
import ActionBarGUI from "./ActionBarGUI";

export default class MainGUI {
	public static gameUI: GameUI;

	// Interfaces
	public static hotbarGUI: HotbarGUI;
	public static actionBarGUI: ActionBarGUI;
	public static gamepadTooltips: InputTooltipsGUI;

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.hotbarGUI = new HotbarGUI(this.gameUI);
		this.actionBarGUI = new ActionBarGUI(this.gameUI);
		this.gamepadTooltips = new InputTooltipsGUI(this.gameUI);
	}
}
