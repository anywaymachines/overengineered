import { ContextActionService, Players } from "@rbxts/services";
import ObservableValue from "shared/event/ObservableValue";
import InputController from "./InputController";

const walkSpeed = 20;
const sprintSpeed = 60;

const sprintmode = new ObservableValue(false);
sprintmode.subscribe((sprinting) => {
	if (!Players.LocalPlayer.Character) return;

	(Players.LocalPlayer.Character.WaitForChild("Humanoid") as Humanoid).WalkSpeed = sprinting
		? sprintSpeed
		: walkSpeed;
});
Players.LocalPlayer.CharacterAdded.Connect(() => sprintmode.triggerChanged());

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
