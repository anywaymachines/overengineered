import { Players } from "@rbxts/services";

/** Basic class for interfaces control */
export default class GuiController {
	/** Receives GameUI from the PlayerGui */
	static getGameUI<T = ScreenGui>() {
		return this.getPlayerGui().WaitForChild("GameUI") as T;
	}

	/** Receives Unscaled from the PlayerGui */
	static getUnscaledGameUI<T = ScreenGui>() {
		return this.getPlayerGui().WaitForChild("Unscaled") as T;
	}

	/** Receives PlayerGui.GameUI.Templates */
	static getTemplates<T>() {
		return this.getGameUI<{ Templates: T }>().Templates;
	}

	/** Receives Popups from the PlayerGui */
	static getPopupUI<T extends ScreenGui>() {
		return this.getPlayerGui().WaitForChild("Popups") as T;
	}

	/** Receives PlayerGui from the client */
	static getPlayerGui() {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
	}

	public static isCursorOnVisibleGui(): boolean {
		const playerGUI = this.getPlayerGui();
		const gameUI = this.getGameUI();
		const mouse = Players.LocalPlayer.GetMouse();
		const objects = playerGUI.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		if (
			objects.some(
				(value) =>
					value.Visible === true &&
					value.BackgroundTransparency < 1 &&
					value.IsDescendantOf(gameUI as unknown as Instance),
			)
		) {
			return true;
		}
		return false;
	}
}
