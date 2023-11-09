import { UserInputService } from "@rbxts/services";
import InputController from "client/controller/InputController";
import Signals from "client/network/Signals";

export default class InputTypeChangeEvent {
	static subscribe() {
		// Event
		UserInputService.LastInputTypeChanged.Connect((lastInputType) => this.onLastInputTypeChanged(lastInputType));
	}

	/** Callback of subscribed event */
	private static onLastInputTypeChanged(lastInputType: Enum.UserInputType) {
		const newInputType = this.getInputTypeByEnum(lastInputType);

		if (newInputType !== InputController.inputType) {
			InputController.inputType = newInputType;

			// Fire a new input type
			Signals.INPUT_TYPE_CHANGED_EVENT.Fire(newInputType);
		}
	}

	/** Returns the input type based on the given input type */
	private static getInputTypeByEnum(userInputType: Enum.UserInputType): typeof InputController.inputType {
		if (userInputType === Enum.UserInputType.Gamepad1) {
			return "Gamepad";
		} else if (userInputType === Enum.UserInputType.Touch) {
			return "Touch";
		} else {
			return "Desktop";
		}
	}
}
