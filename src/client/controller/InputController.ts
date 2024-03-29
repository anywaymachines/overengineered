import { GuiService, UserInputService } from "@rbxts/services";
import ObservableValue from "shared/event/ObservableValue";

/** Basic class of input data type control */
export default class InputController {
	static readonly inputType = new ObservableValue<InputType>(InputController.getPhysicalInputType());

	/** Returns the input type based on the device the client is playing from */
	static getPhysicalInputType(): InputType {
		if (GuiService.IsTenFootInterface()) {
			return "Gamepad";
		} else if (UserInputService.TouchEnabled && !UserInputService.MouseEnabled) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	/** Returns true if the right or left ctrl is pressed */
	static isCtrlPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftControl) ||
			UserInputService.IsKeyDown(Enum.KeyCode.RightControl)
		);
	}

	/** Returns true if the right or left shift is pressed */
	static isShiftPressed(): boolean {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift)
		);
	}
}
