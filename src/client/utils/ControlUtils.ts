import { RunService, UserInputService } from "@rbxts/services";

export default class ControlUtils {
	static isPC() {
		return UserInputService.KeyboardEnabled && UserInputService.MouseEnabled;
	}

	static isGamepad() {
		return UserInputService.GamepadConnected;
	}

	static isMobile() {
		return (
			(!this.isPC() && !this.isGamepad && UserInputService.TouchEnabled) ||
			(RunService.IsStudio() && UserInputService.TouchEnabled)
		);
	}
}
