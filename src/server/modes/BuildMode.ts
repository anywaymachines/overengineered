import { Players } from "@rbxts/services";
import Logger from "shared/Logger";
import PlayModeBase from "./PlayModeBase";
import { PlayModeControllerType } from "./PlayModeControllerType";

export default class BuildMode implements PlayModeBase {
	constructor(controller: PlayModeControllerType) {
		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect((character) => {
				const response = controller.changeModeForPlayer(plr, "build");
				if (!response.success) Logger.error(response.message);

				// on death
				(character.WaitForChild("Humanoid") as Humanoid).Died.Once(() => {
					if (controller.getPlayerMode(plr) !== "build") return;

					const response = controller.changeModeForPlayer(plr, undefined);
					if (!response.success) Logger.error(response.message);
				});
			});
		});
	}

	onTransitionFrom(player: Player, prevmode: PlayModes | undefined): Response | undefined {
		if (prevmode === undefined || prevmode === "ride") {
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
