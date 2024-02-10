import { UserInputService } from "@rbxts/services";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";

/** A permanent event that monitors the change in the type of input type, which makes the game more flexible */
export default class InputTypeChangeEvent {
	/** Returns the input type based on the given input type */
	private static getInputTypeByEnum(userInputType: Enum.UserInputType): InputType {
		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Gamepad";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}

	/** Callback of subscribed event */
	private static onLastInputTypeChanged(lastInputType: Enum.UserInputType) {
		const newInputType = this.getInputTypeByEnum(lastInputType);

		if (newInputType !== InputController.inputType.get()) {
			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			InputController.inputType.set(newInputType);
			this.share();

			LogControl.instance.addLine("New input type set to " + newInputType, Colors.yellow);
		}
	}

	private static share() {
		Remotes.Client.GetNamespace("Player").Get("InputTypeInfo").SendToServer(InputController.inputType.get());
	}

	static subscribe() {
		// Event
		UserInputService.LastInputTypeChanged.Connect((lastInputType) => this.onLastInputTypeChanged(lastInputType));
		this.share();
	}
}
