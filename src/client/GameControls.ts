import { GuiService, UserInputService } from "@rbxts/services";

export default class GameControls {
	static getActualPlatform(): "Console" | "Touch" | "Desktop" {
		const userInputType = UserInputService.GetLastInputType();

		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Console";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	static getPhysicalPlatform(): "Console" | "Touch" | "Desktop" {
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
