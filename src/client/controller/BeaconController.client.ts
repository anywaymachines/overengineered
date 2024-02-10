import { Players } from "@rbxts/services";
import Beacon from "client/gui/Beacon";
import SharedPlots from "shared/building/SharedPlots";

Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect((char) => {
		new Beacon((char.WaitForChild("Humanoid") as Humanoid).RootPart!, player.Name, "players").enable();
	});
});

let plot: PlotModel | undefined;
while (!plot) {
	plot = SharedPlots.tryGetPlotByOwnerID(Players.LocalPlayer.UserId);
	wait(0.1);
}
new Beacon(plot!, "Plot", "plot").enable();
