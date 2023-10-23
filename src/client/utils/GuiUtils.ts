import { Players } from "@rbxts/services";

export default class GuiUtils {
	public static getPlayerGui(): PlayerGui {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
	}
}
