import { Players } from "@rbxts/services";
import { PlayModeBase } from "./PlayModeBase";

export type PlayModeControllerType = {
	getPlayerMode(player: Player): PlayModes | undefined;
	changeModeForPlayer(this: void, player: Player, mode: PlayModes | undefined): Promise<Response>;
};

export class BuildMode implements PlayModeBase {
	constructor(controller: PlayModeControllerType) {
		const runchar = async (plr: Player, character: Model) => {
			// on spawn
			const response = await controller.changeModeForPlayer(plr, "build");
			if (!response.success) $err(response.message);

			// on death
			(character.WaitForChild("Humanoid") as Humanoid).Died.Once(async () => {
				const prev = controller.getPlayerMode(plr);
				if (prev !== "build" && prev !== undefined) return;

				const response = await controller.changeModeForPlayer(plr, undefined);
				if (!response.success) $err(response.message);
			});
		};
		const sub = (plr: Player) => {
			const char = plr.FindFirstChild("Character") as Model | undefined;
			if (char) {
				runchar(plr, char);
			} else {
				plr.CharacterAdded.Connect(async (char) => runchar(plr, char));
			}
		};

		Players.PlayerAdded.Connect(sub);
		for (const player of Players.GetPlayers()) {
			sub(player);
		}
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
