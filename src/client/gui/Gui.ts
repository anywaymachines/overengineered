import { Players } from "@rbxts/services";

export namespace Gui {
	/** Receives GameUI from the PlayerGui */
	export function getGameUI<T = ScreenGui>() {
		return getPlayerGui().WaitForChild("GameUI") as T;
	}

	/** Receives Unscaled from the PlayerGui */
	export function getUnscaledGameUI<T = ScreenGui>() {
		return getPlayerGui().WaitForChild("Unscaled") as T;
	}

	/** Receives PlayerGui.GameUI.Templates */
	export function getTemplates<T>() {
		return getGameUI<{ Templates: T }>().Templates;
	}

	/** Receives Popups from the PlayerGui */
	export function getPopupUI<T extends ScreenGui>() {
		return getPlayerGui().WaitForChild("Popups") as T;
	}

	/** Receives PlayerGui from the client */
	export function getPlayerGui<T = PlayerGui>() {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as T;
	}

	export function isCursorOnVisibleGui(): boolean {
		const playerGUI = getPlayerGui();
		const gameUI = getGameUI();
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
