import { Players, UserInputService } from "@rbxts/services";
import ObservableValue from "shared/event/ObservableValue";
import GuiController from "./GuiController";
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

// -------------------
// desktop
UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard || input.KeyCode !== Enum.KeyCode.LeftShift) {
		return;
	}

	sprintmode.set(true);
});
UserInputService.InputEnded.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard || input.KeyCode !== Enum.KeyCode.LeftShift) {
		return;
	}

	sprintmode.set(false);
});

// -------------------
// console
UserInputService.InputBegan.Connect((input) => {
	if (input.KeyCode !== Enum.KeyCode.ButtonY) {
		return;
	}

	sprintmode.set(true);
});
UserInputService.InputEnded.Connect((input) => {
	if (input.KeyCode !== Enum.KeyCode.ButtonY) {
		return;
	}

	sprintmode.set(false);
});

// -------------------
// mobile
const mobileGui = GuiController.getGameUI().WaitForChild("MobileSprint") as Frame & {
	Toggle: GuiButton & { Icon: ImageLabel };
};
InputController.inputType.subscribe((input) => (mobileGui.Visible = input === "Touch"), true);
InputController.inputType.subscribe((input) => print("swt to " + input), true);

sprintmode.subscribe((sprinting) => (mobileGui.Toggle.Icon.ImageTransparency = sprinting ? 0 : 0.5));
mobileGui.Toggle.Activated.Connect(() => sprintmode.set(!sprintmode.get()));
