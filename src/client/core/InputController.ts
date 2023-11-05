import { GuiService, Players, UserInputService } from "@rbxts/services";
import Signals from "./network/Signals";

export default class InputController {
	public static currentPlatform: "Console" | "Touch" | "Desktop" = this.getPhysicalPlatform();

	private static playerModule = require(
		Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript,
	);

	public static initialize() {
		Signals.PLATFORM_CHANGED.Fire(this.currentPlatform);

		UserInputService.InputChanged.Connect(() => {
			const newPlatform = InputController.getPlatformByLastInput();
			if (this.currentPlatform !== newPlatform) {
				this.currentPlatform = newPlatform;
				Signals.PLATFORM_CHANGED.Fire(newPlatform);
			}
		});

		UserInputService.InputBegan.Connect((input, _) => {
			if (input.UserInputType === Enum.UserInputType.Keyboard) {
				Signals.KEYBOARD.KEYBOARD_KEY_DOWN.Fire(input.KeyCode);
			} else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
				Signals.GAMEPAD.GAMEPAD_KEY_DOWN.Fire(input.KeyCode);
			}
		});

		UserInputService.InputEnded.Connect((input, _) => {
			if (input.UserInputType === Enum.UserInputType.Keyboard) {
				Signals.KEYBOARD.KEYBOARD_KEY_UP.Fire(input.KeyCode);
			} else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
				Signals.GAMEPAD.GAMEPAD_KEY_UP.Fire(input.KeyCode);
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
