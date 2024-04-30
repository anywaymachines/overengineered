import { Players } from "@rbxts/services";
import { Beacon } from "client/gui/Beacon";
import { rootComponents } from "client/test/RootComponents";
import { SharedPlots } from "shared/building/SharedPlots";
import { Component } from "shared/component/Component";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";

// plot beacon
spawn(() => {
	const plot = SharedPlots.waitForPlot(Players.LocalPlayer.UserId).instance.BuildingArea;
	const beacon = new Beacon(plot, "Plot", "plot");
	rootComponents.push(beacon);
	beacon.enable();
});

// players beacon
spawn(() => {
	const playerBeacons = new ComponentKeyedChildren<string, Beacon>(new Component().with((c) => c.enable()));

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
