import { Players } from "@rbxts/services";
import { $err } from "rbxts-transformer-macros";
import { PlayModeBase } from "./PlayModeBase";

export type PlayModeControllerType = {
	getPlayerMode(player: Player): PlayModes | undefined;
	changeModeForPlayer(this: void, player: Player, mode: PlayModes | undefined): Promise<Response>;
};

export class BuildMode implements PlayModeBase {
	constructor(controller: PlayModeControllerType) {
		Players.PlayerAdded.Connect((plr) => {
			// on spawn
			plr.CharacterAdded.Connect(async (character) => {
				const response = await controller.changeModeForPlayer(plr, "build");
				if (!response.success) $err(response.message);

				// on death
				(character.WaitForChild("Humanoid") as Humanoid).Died.Once(async () => {
					if (controller.getPlayerMode(plr) !== "build") return;

					const response = await controller.changeModeForPlayer(plr, undefined);
					if (!response.success) $err(response.message);
				});
			});
		});
	}

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
