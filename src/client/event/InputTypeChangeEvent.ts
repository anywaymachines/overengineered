import { UserInputService } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import { LogControl } from "client/gui/static/LogControl";

/** A permanent event that monitors the change in the type of input type, which makes the game more flexible */
export namespace InputTypeChangeEvent {
	/** Returns the input type based on the given input type */
	function getInputTypeByEnum(userInputType: Enum.UserInputType): InputType {
		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Gamepad";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	/** Callback of subscribed event */
	function onLastInputTypeChanged(lastInputType: Enum.UserInputType) {
		const newInputType = getInputTypeByEnum(lastInputType);

		if (newInputType !== InputController.inputType.get()) {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			InputController.inputType.set(newInputType);
			LogControl.instance.addLine("New input type set to " + newInputType, Colors.yellow);
		}
	}

	export function subscribe() {
		// Event
		UserInputService.LastInputTypeChanged.Connect(onLastInputTypeChanged);
	}
}
