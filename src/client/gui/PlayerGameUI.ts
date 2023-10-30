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
		this.updatePlatformGuis();
	}

	public static onPlatformChanged() {
		// TODO: call platform changed using interfaces
		const newPlatform = GameControls.getPlatform();
		if (this.currentControlType !== newPlatform) {
			this.currentControlType = newPlatform;
			this.updatePlatformGuis();

			Logger.info("[PlayerGameUI] Input type changed to " + this.currentControlType);
		}
	}

	private static updatePlatformGuis() {
		// Display gamepad tooltips
		this.gameUI.GamepadTooltips.GetChildren().forEach((gui) => {
			if (!gui.IsA("GuiObject")) {
				return;
			}
			if (this.currentControlType === "Console") {
				gui.Visible = true;
			} else {
				gui.Visible = false;
			}
		});

		this.ToolsGUI.onPlatformChanged();

		// TODO: Send notification about changing platform
	}
}
