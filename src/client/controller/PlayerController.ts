import { Players } from "@rbxts/services";

export type PlayerModule = { GetControls(): { Disable(): void; Enable(): void } };

export default class PlayerController {
	static GetPlayerModule(): PlayerModule {
		return require(
			Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript,
		) as PlayerModule;
	}

	static DisableControls() {
		const PlayerControls = this.GetPlayerModule().GetControls();
		PlayerControls.Disable();
	}

	static EnableControls() {
		const PlayerControls = this.GetPlayerModule().GetControls();
		PlayerControls.Enable();
	}
}
