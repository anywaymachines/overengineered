export namespace PlayerUtils {
	export function isAlive(this: void, player: Player): boolean {
		return (
			player.Character !== undefined &&
			player.Character.FindFirstChild("Humanoid") !== undefined &&
			(player.Character.FindFirstChild("Humanoid") as Humanoid).Health > 0
		);
	}

	export function isPlayerPart(part: BasePart): boolean {
		return (
			(part.IsA("BasePart") &&
				part.Parent &&
				part.Parent.IsA("Model") &&
				(part.Parent as Model).PrimaryPart &&
				(part.Parent as Model).PrimaryPart!.Name === "HumanoidRootPart") === true
		);
	}
}
