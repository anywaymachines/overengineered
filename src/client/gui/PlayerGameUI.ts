import GuiUtils from "client/utils/GuiUtils";
import ToolsGui from "./tool/ToolsGui";
import AliveEventsHandler from "client/AliveEventsHandler";
import { UserInputService } from "@rbxts/services";
import GameControls from "client/GameControls";
import Logger from "shared/Logger";

export default class PlayerGameUI {
	public static gameUI: GameUI;
	public static ToolsGUI: ToolsGui;
	public static currentControlType = GameControls.getPlatform();

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.ToolsGUI = new ToolsGui(this.gameUI);

		AliveEventsHandler.registerAliveEvent(UserInputService.InputChanged, () => this.onPlatformChanged());
	}

	public static onPlatformChanged() {
		const newPlatform = GameControls.getPlatform();
		if (this.currentControlType !== newPlatform) {
			this.currentControlType = GameControls.getPlatform();
			this.ToolsGUI.onPlatformChanged();
			Logger.info("[PlayerGameUI] Input type changed to " + newPlatform);

			// TODO: Send notification about changing platform
		}
	}
}
