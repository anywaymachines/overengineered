import { Players } from "@rbxts/services";
import { ServerBuilding } from "server/building/ServerBuilding";
import { Element } from "shared/Element";
import SharedPlots from "shared/building/SharedPlots";
import { PlotFloatingImageController } from "./PlotsFloatingImageController";

const tryGetFreePlot = () => SharedPlots.plots.find((p) => p.ownerId.get() === undefined);
const assignPlotTo = (player: Player): void => {
	try {
		const plot = tryGetFreePlot();
		if (!plot) throw "No free plot available";

		plot.ownerId.set(player.UserId);
		plot.instance.Blocks.AddPersistentPlayer(player);
	} catch {
		player.Kick("No free plot found, try again later");
	}
};
const resetPlotOf = (player: Player): void => {
	const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
	ServerBuilding.clearPlot(plot.instance);

	if (plot.instance.Blocks.GetPersistentPlayers().includes(player)) {
		plot.instance.Blocks.RemovePersistentPlayer(player);
	}

	plot.ownerId.set(undefined);
	plot.whitelistedPlayers.set([5243461283]);
	plot.blacklistedPlayers.set(undefined);
};

// Plot assignment
Players.PlayerAdded.Connect((player) => assignPlotTo(player));
Players.PlayerRemoving.Connect((player) => resetPlotOf(player));

// Floating username+image controller
for (const plot of SharedPlots.plots) {
	const controller = new PlotFloatingImageController(plot);
	controller.enable();
}

// Plot.Blocks initialization
const initializeBlocksFolder = (plot: PlotModel) => {
	const create = () => {
		plot.FindFirstChild("Blocks")?.Destroy();
		const blocks = Element.create("Model", {
			Name: "Blocks",
			ModelStreamingMode: Enum.ModelStreamingMode.PersistentPerPlayer,
			Parent: plot,
		});

		blocks.GetPropertyChangedSignal("Parent").Once(create);
	};

	create();
};
for (const plot of SharedPlots.plots) {
	initializeBlocksFolder(plot.instance);
}

export const ServerPlots = {
	/** Empty method to trigger initialization */
	initialize: () => {},
} as const;
