import { Players } from "@rbxts/services";
import Beacon from "client/gui/Beacon";
import SharedPlots from "shared/building/SharedPlots";

// plot beacon
spawn(() => {
	let plot: PlotModel | undefined;
	while (!plot) {
		plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
		wait(0.1);
	}
	new Beacon(plot!, "Plot", "plot").enable();
});

// players beacon
spawn(() => {
	const createPlayerBeacon = (player: Player) => {
		// spawn() just in case of infinite wait for something
		spawn(() => {
			while (!player.Character) {
				task.wait(0.1);
			}

			const humanoid = player.Character.WaitForChild("Humanoid") as Humanoid;
			while (!humanoid.RootPart) {
				task.wait(0.1);
			}

			new Beacon(humanoid.RootPart, player.DisplayName, "players").enable();
		});
	};

	Players.PlayerAdded.Connect((player) => {
		player.CharacterAdded.Connect(() => createPlayerBeacon(player));
	});
	for (const player of Players.GetPlayers()) {
		if (player === Players.LocalPlayer) continue;
		createPlayerBeacon(player);
	}
});
