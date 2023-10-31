import { GuiService, UserInputService } from "@rbxts/services";

export default class GameControls {
	static getPlatform(): "Console" | "Touch" | "Desktop" {
		const userInputType = UserInputService.GetLastInputType();

		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Console";
		} else if (userInputType === Enum.UserInputType.Touch) {
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
