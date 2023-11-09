import { Players } from "@rbxts/services";

export default class GuiController {
	/** Receives PlayerGui from the client */
	static getPlayerGui() {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
	}

	/** Receives GameUI from the PlayerGui */
	static getGameUI(): GameUI {
		return this.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
	}
}
