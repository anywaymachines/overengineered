export default class PlayerUtils {
	static isAlive(player: Player): boolean {
		return (
			player.Character !== undefined &&
			player.Character.FindFirstChild("Humanoid") !== undefined &&
			(player.Character.FindFirstChild("Humanoid") as Humanoid).Health > 0
		);
	}
}
