import { Players } from "@rbxts/services";
import Beacon from "client/gui/Beacon";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import ComponentBase from "shared/component/SharedComponentBase";

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
	const playerBeacons = new ComponentKeyedChildren<string, Beacon>(new ComponentBase().with((c) => c.enable()));

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

			playerBeacons.add(player.Name, new Beacon(humanoid.RootPart, player.DisplayName, "players"));
		});
	};

	const initPlayer = (player: Player) => {
		player.CharacterAdded.Connect(() => createPlayerBeacon(player));
		player.CharacterRemoving.Connect(() => playerBeacons.remove(player.Name));
	};

	Players.PlayerAdded.Connect(initPlayer);
	for (const player of Players.GetPlayers()) {
		if (player === Players.LocalPlayer) continue;

		createPlayerBeacon(player);
		initPlayer(player);
	}
});
