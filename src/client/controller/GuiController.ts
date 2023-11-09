import { Players } from "@rbxts/services";

/** Basic class for interfaces control */
export default class GuiController {
	/** Receives GameUI from the PlayerGui */
	static getGameUI(): GameUI {
		return this.getPlayerGui().WaitForChild("GameUI") as unknown as GameUI;
	}

	/** Receives PlayerGui from the client */
	static getPlayerGui() {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
	}
}
