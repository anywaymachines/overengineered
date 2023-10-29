import GuiUtils from "client/utils/GuiUtils";
import ToolsGui from "./tool/ToolsGui";
import { UserInputService } from "@rbxts/services";
import GameControls from "client/GameControls";
import Logger from "shared/Logger";
import AliveEventsHandler from "client/AliveEventsHandler";

export default class PlayerGameUI {
	public static gameUI: MyGui;
	public static ToolsGUI: ToolsGui;
	//public static BlocksSelectionGui: BlocksSelectionGui;
	public static currentControlType = GameControls.getPlatform();

	public static initialize() {
		this.gameUI = GuiUtils.getGameUI();

		// Windows
		this.ToolsGUI = new ToolsGui(this.gameUI);
		//this.BlocksSelectionGui = new BlocksSelectionGui(this.gameUI);

		AliveEventsHandler.registerAliveEvent(UserInputService.InputChanged, () => this.onPlatformChanged());
	}

	public static onPlatformChanged() {
		// TODO: call platform changed using interfaces
		const newPlatform = GameControls.getPlatform();
		if (this.currentControlType !== newPlatform) {
			this.currentControlType = GameControls.getPlatform();
			this.ToolsGUI.onPlatformChanged();
			Logger.info("[PlayerGameUI] Input type changed to " + newPlatform);

			// TODO: Send notification about changing platform
		}
	}
}
