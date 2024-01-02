export default class PlayerUtils {
	static isAlive(this: void, player: Player): boolean {
		return (
			player.Character !== undefined &&
			player.Character.FindFirstChild("Humanoid") !== undefined &&
			(player.Character.FindFirstChild("Humanoid") as Humanoid).Health > 0
		);
	}
}
