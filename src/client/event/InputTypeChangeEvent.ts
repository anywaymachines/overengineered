import { UserInputService } from "@rbxts/services";
import InputController from "client/controller/InputController";
import StaticWidgetsController from "client/controller/StaticWidgetsController";
import Signals from "client/event/Signals";
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

		if (newInputType !== InputController.inputType) {
			InputController.inputType = newInputType;

			// Fire a new input type
			Signals.INPUT_TYPE_CHANGED_EVENT.Fire(newInputType);
			Remotes.Client.GetNamespace("Player").Get("InputTypeInfo").SendToServer(newInputType);

			StaticWidgetsController.logStaticWidget.addLine(
				"New input type set to " + newInputType,
				Color3.fromRGB(252, 252, 145),
			);
		}
	}

	static subscribe() {
		// Event
		UserInputService.LastInputTypeChanged.Connect((lastInputType) => this.onLastInputTypeChanged(lastInputType));
	}
}
