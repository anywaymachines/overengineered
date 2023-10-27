import { UserInputService } from "@rbxts/services";

export default class ControlUtils {
	static isPC() {
		return UserInputService.MouseEnabled;
	}

	static isGamepad() {
		return UserInputService.GamepadConnected;
	}

	static isMobile() {
		return UserInputService.TouchEnabled && !UserInputService.KeyboardEnabled;
	}
}
