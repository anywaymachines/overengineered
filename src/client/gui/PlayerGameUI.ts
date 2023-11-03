import GuiUtils from "client/utils/GuiUtils";
import HotbarGUI from "./HotbarGUI";
import ControlTooltips from "./ControlTooltips";

export default class PlayerGameUI {
	public static gameUI: GameUI;

	// Interfaces
	public static hotbarGUI: HotbarGUI;
	public static gamepadTooltips: ControlTooltips;

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.hotbarGUI = new HotbarGUI(this.gameUI);
		this.gamepadTooltips = new ControlTooltips(this.gameUI);
	}
}
