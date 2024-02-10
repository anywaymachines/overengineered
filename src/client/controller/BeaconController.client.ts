import { Players } from "@rbxts/services";
import Beacon from "client/gui/Beacon";
import SharedPlots from "shared/building/SharedPlots";

const createPlayerBeacon = (player: Player) => {
	while (!player.Character) {
		task.wait(0.1);
	}

	new Beacon((player.Character!.WaitForChild("Humanoid") as Humanoid).RootPart!, player.Name, "players").enable();
};
Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect(() => createPlayerBeacon(player));
});
for (const player of Players.GetPlayers()) {
	createPlayerBeacon(player);
}

let plot: PlotModel | undefined;
while (!plot) {
	plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
	wait(0.1);
}
new Beacon(plot!, "Plot", "plot").enable();
