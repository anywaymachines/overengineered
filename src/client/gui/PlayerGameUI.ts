import GuiUtils from "client/utils/GuiUtils";
import ToolsGui from "./ToolsGui";
import { UserInputService } from "@rbxts/services";
import GameControls from "client/GameControls";
import Logger from "shared/Logger";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import ControlTooltips from "./ControlTooltips";

export default class PlayerGameUI {
	public static gameUI: GameUI;

	public static ToolsGUI: ToolsGui;
	public static gamepadTooltips: ControlTooltips;
	public static currentControlType = GameControls.getPhysicalPlatform();

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.ToolsGUI = new ToolsGui(this.gameUI);
		this.gamepadTooltips = new ControlTooltips(this.gameUI);

		AliveEventsHandler.registerAliveEvent(UserInputService.InputChanged, () => this.onPlatformChanged());
		this.updatePlatformGuis(this.currentControlType);
	}

	public static onPlatformChanged() {
		const newPlatform = GameControls.getActualPlatform();
		if (this.currentControlType !== newPlatform) {
			this.currentControlType = newPlatform;
			this.updatePlatformGuis(newPlatform);
			Logger.info("[PlayerGameUI] Input type changed to " + this.currentControlType);
		}
	}

	private static updatePlatformGuis(platform: string) {
		// Display gamepad tooltips
		this.ToolsGUI.onPlatformChanged(platform);
		this.gamepadTooltips.onPlatformChanged(platform);

		// TODO: Send notification about changing platform
	}
}
