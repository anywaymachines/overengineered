import { Players } from "@rbxts/services";
import { ServerBuilding } from "server/building/ServerBuilding";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController } from "server/modes/PlayModeController";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { Element } from "shared/Element";
import { SlotsMeta } from "shared/SlotsMeta";
import { SharedPlot } from "shared/building/SharedPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { PlotFloatingImageController } from "./PlotsFloatingImageController";

const tryGetFreePlot = () => SharedPlots.plots.find((p) => p.ownerId.get() === undefined);
const assignPlotTo = (player: Player): void => {
	try {
		const plot = tryGetFreePlot();
		if (!plot) throw "No free plot available";

		plot.ownerId.set(player.UserId);
		plot.instance.Blocks.ClearAllChildren();
		player.RespawnLocation = plot.instance.WaitForChild("SpawnLocation") as SpawnLocation;
	} catch {
		player.Kick("No free plot found, try again later");
	}
};
const savePlotOf = (player: Player): void => {
	const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
	const save = PlayModeController.getPlayerMode(player) === "build" && plot.getBlocks().size() !== 0;

	if (save) {
		SlotDatabase.instance.setBlocks(
			player.UserId,
			SlotsMeta.quitSlotIndex,
			BlocksSerializer.serialize(plot.instance),
			plot.getBlocks().size(),
		);
	} else {
		SlotDatabase.instance.setBlocksFromAnotherSlot(
			player.UserId,
			SlotsMeta.quitSlotIndex,
			SlotsMeta.autosaveSlotIndex,
		);
	}
};
const resetPlotOf = (player: Player): void => {
	const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
	plot.ownerId.set(undefined);
	plot.whitelistedPlayers.set([5243461283]);
	plot.blacklistedPlayers.set(undefined);

	ServerBuilding.clearPlot(plot.instance);

	if (plot.instance.Blocks.GetPersistentPlayers().includes(player)) {
		plot.instance.Blocks.RemovePersistentPlayer(player);
	}
};

// Plot assignment
Players.PlayerAdded.Connect((player) => assignPlotTo(player));
Players.PlayerRemoving.Connect((player) => {
	savePlotOf(player);
	resetPlotOf(player);
});

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
			ModelStreamingMode: Enum.ModelStreamingMode.Nonatomic,
		});

		blocks.Parent = plot;
		blocks.GetPropertyChangedSignal("Parent").Once(create);
	};

	create();
};
const initializeSpawnLocation = (plot: SharedPlot) => {
	const spawnLocation = new Instance("SpawnLocation");
	spawnLocation.Name = "SpawnLocation";
	spawnLocation.Anchored = true;
	spawnLocation.Transparency = 1;
	spawnLocation.CanCollide = false;
	spawnLocation.CanQuery = false;
	spawnLocation.CanTouch = false;
	spawnLocation.PivotTo(new CFrame(plot.getSpawnPosition()));

	spawnLocation.Parent = plot.instance;
};

for (const plot of SharedPlots.plots) {
	initializeBlocksFolder(plot.instance);
	initializeSpawnLocation(plot);
}

export namespace ServerPlots {
	/** Empty method to trigger initialization */
	export function initialize() {}
}
