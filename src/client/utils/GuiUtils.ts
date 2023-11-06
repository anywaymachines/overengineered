import { Players } from "@rbxts/services";

export default class GuiUtils {
	public static getPlayerGui(): PlayerGui {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
	}

	public static getGameUI(): GameUI {
		return this.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
	}

	public static getGameDialog(): GameDialog {
		return this.getPlayerGui().WaitForChild("GameDialog") as unknown as GameDialog;
	}

	public static isCursorOnVisibleGui(): boolean {
		const playerGUI = GuiUtils.getPlayerGui();
		const gameUI = this.getGameUI();
		const mouse = Players.LocalPlayer.GetMouse();
		const objects = playerGUI.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		if (objects.some((value) => value.Visible === true && value.IsDescendantOf(gameUI as unknown as Instance))) {
			return true;
		}
		return false;
	}
}
