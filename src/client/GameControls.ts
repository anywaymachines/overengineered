import { GuiService, UserInputService } from "@rbxts/services";
import ClientSignals from "./ClientSignals";

export default class GameInput {
	public static currentPlatform: "Console" | "Touch" | "Desktop" = GameInput.getPhysicalPlatform();

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
