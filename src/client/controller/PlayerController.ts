import { Players } from "@rbxts/services";
import { PlayerModule } from "client/types/PlayerModule";

export default class PlayerController {
	static getPlayerModule(): PlayerModule {
		return require(
			Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript,
		) as PlayerModule;
	}
}
