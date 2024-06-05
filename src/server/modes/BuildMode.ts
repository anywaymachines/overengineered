import type { PlayModeBase } from "server/modes/PlayModeBase";

@injectable
export class BuildMode implements PlayModeBase {
	onTransitionFrom(player: Player, prevmode: PlayModes | undefined): Response | undefined {
		if (prevmode === undefined || prevmode === "ride") {
			const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
			if (humanoid !== undefined) humanoid.Health = humanoid.MaxHealth;
			/*if (Players.LocalPlayer.Character && Players.LocalPlayer.Character.GetPivot().Position.Magnitude > 100) {
				Workspace.FindFirstChild("Terrain")?.Destroy();
			}*/

			return { success: true };
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined): Response | undefined {
		if (nextmode === undefined || nextmode === "ride") {
			return { success: true };
		}
	}
}
