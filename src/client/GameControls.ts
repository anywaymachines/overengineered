import { GuiService, Players, UserInputService } from "@rbxts/services";
import ClientSignals from "./ClientSignals";

export default class GameInput {
	public static currentPlatform: "Console" | "Touch" | "Desktop" = GameInput.getPhysicalPlatform();

	private static playerModule = require(
		Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript,
	);

	static {
		ClientSignals.PLATFORM_CHANGED.Fire(this.currentPlatform);
		UserInputService.InputChanged.Connect(() => {
			const newPlatform = GameInput.getPlatformByLastInput();
			if (this.currentPlatform !== newPlatform) {
				this.currentPlatform = newPlatform;
				ClientSignals.PLATFORM_CHANGED.Fire(newPlatform);
			}
		});
	}

	public static switchControls(state: boolean) {
		if (state) {
			(this.playerModule as { Enable: () => void }).Enable();
		} else {
			(this.playerModule as { Disable: () => void }).Disable();
		}
	}

	private static getPlatformByLastInput(): typeof this.currentPlatform {
		const userInputType = UserInputService.GetLastInputType();

		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Console";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	static getPhysicalPlatform(): typeof this.currentPlatform {
		if (GuiService.IsTenFootInterface()) {
			return "Console";
		} else if (UserInputService.TouchEnabled && !UserInputService.MouseEnabled) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	static isShiftPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift)
		);
	}

	static isPaused(): boolean {
		return GuiService.MenuIsOpen;
	}
}
