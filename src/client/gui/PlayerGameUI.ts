import GuiUtils from "client/utils/GuiUtils";
import ToolsGui from "./ToolsGui";
import { UserInputService } from "@rbxts/services";
import GameControls from "client/GameControls";
import Logger from "shared/Logger";
import AliveEventsHandler from "client/event/AliveEventsHandler";
import GamepadTooltips from "./GamepadTooltips";

export default class PlayerGameUI {
	public static gameUI: MyGui;

	public static ToolsGUI: ToolsGui;
	public static gamepadTooltips: GamepadTooltips;
	public static currentControlType = GameControls.getPlatform();

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.ToolsGUI = new ToolsGui(this.gameUI);
		this.gamepadTooltips = new GamepadTooltips(this.gameUI);

		AliveEventsHandler.registerAliveEvent(UserInputService.InputChanged, () => this.onPlatformChanged());
		this.updatePlatformGuis();
	}

	public static onPlatformChanged() {
		const newPlatform = GameControls.getPlatform();
		if (this.currentControlType !== newPlatform) {
			this.currentControlType = newPlatform;
			this.updatePlatformGuis();
			Logger.info("[PlayerGameUI] Input type changed to " + this.currentControlType);
		}
	}

	private static updatePlatformGuis() {
		// Display gamepad tooltips
		this.ToolsGUI.onPlatformChanged();
		this.gamepadTooltips.onControlChanged();

		// TODO: Send notification about changing platform
	}
}
