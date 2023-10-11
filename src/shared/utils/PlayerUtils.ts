export default class PlayerUtils {
	static isAlive(player: Player): boolean {
		return (
			player.Character !== undefined &&
			player.Character.FindFirstChild("Humanoid") !== undefined &&
			(player.Character.FindFirstAncestor("Humanoid") as Humanoid).Health > 0
		);
	}
}
