import { ContextActionService } from "@rbxts/services";
import PlayerController from "client/PlayerController";
import Signals from "client/event/Signals";
import ObservableValue from "shared/event/ObservableValue";
import InputController from "./InputController";

const walkSpeed = 20;
const sprintSpeed = 60;

const sprintmode = new ObservableValue(false);
sprintmode.subscribe((sprinting) => {
	if (!PlayerController.controllerManager) return;

	PlayerController.controllerManager.BaseMoveSpeed = sprinting ? sprintSpeed : walkSpeed;
}, true);
Signals.PLAYER.SPAWN.Connect(() => sprintmode.triggerChanged());

function runEvent(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject) {
	if (inputState !== Enum.UserInputState.Begin) {
		sprintmode.set(false);
		return Enum.ContextActionResult.Pass;
	}
	sprintmode.set(true);
	return Enum.ContextActionResult.Pass;
}

InputController.inputType.subscribe((value) => {
	ContextActionService.UnbindAction("Sprint");
	ContextActionService.BindAction(
		"Sprint",
		runEvent,
		value === "Touch",
		Enum.KeyCode.LeftShift,
		Enum.KeyCode.ButtonY,
	);
	ContextActionService.SetImage("Sprint", "rbxassetid://9555118706");
	ContextActionService.SetDescription("Sprint", "Allows you to move more quickly");
}, true);
