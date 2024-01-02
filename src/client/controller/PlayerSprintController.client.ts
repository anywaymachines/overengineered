import { Players, UserInputService } from "@rbxts/services";

const setWalkSpeed = (speed: number) => {
	(Players.LocalPlayer.Character!.WaitForChild("Humanoid") as Humanoid).WalkSpeed = speed;
};

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard || input.KeyCode !== Enum.KeyCode.LeftShift) {
		return;
	}

	setWalkSpeed(60);
});
UserInputService.InputEnded.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard || input.KeyCode !== Enum.KeyCode.LeftShift) {
		return;
	}

	setWalkSpeed(20);
});
