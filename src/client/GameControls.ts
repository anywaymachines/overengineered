import { GuiService, UserInputService } from "@rbxts/services";

export default class GameControls {
	public static readonly Type = { PC: 0, Console: 1, Mobile: 2, VR: 3 };

	static shiftPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift)
		);
	}

	static getControlType(): ControlType {
		// VR (full)
		if (UserInputService.VREnabled && UserInputService.GamepadEnabled) {
			return {
				id: this.Type.VR,
			};
		}

		// PC
		if (UserInputService.MouseEnabled && UserInputService.KeyboardEnabled) {
			return {
				id: this.Type.PC,
			};
		}

		// Console
		if (UserInputService.GamepadEnabled) {
			return {
				id: this.Type.Console,
			};
		}

		// Mobile
		return {
			id: this.Type.Mobile,
		};
	}

	static isPaused(): boolean {
		return GuiService.MenuIsOpen;
	}
}
