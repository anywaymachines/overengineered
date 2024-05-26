import { Players } from "@rbxts/services";
import { ServerBuilding } from "server/building/ServerBuilding";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController } from "server/modes/PlayModeController";
import { PlayersController } from "server/player/PlayersController";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { PlotFloatingImageController } from "server/plots/PlotsFloatingImageController";
import { SharedPlots } from "shared/building/SharedPlots";
import { Controller } from "shared/component/Controller";
import { Element } from "shared/Element";
import { SlotsMeta } from "shared/SlotsMeta";
import type { SharedPlot } from "shared/building/SharedPlot";

namespace Stuff {
	export function tryGetFreePlot(): SharedPlot | undefined {
		return SharedPlots.plots.find((p) => p.ownerId.get() === undefined);
	}
	export function savePlot(player: Player, plot: SharedPlot): void {
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
	}
	export function resetPlot(plot: SharedPlot): void {
		plot.ownerId.set(undefined);
		plot.whitelistedPlayers.set([5243461283]);
		plot.blacklistedPlayers.set(undefined);

		ServerBuilding.clearPlot(plot.instance);
	}

	export function initializeBlocksFolder(plot: SharedPlot) {
		plot.instance.FindFirstChild("Blocks")?.Destroy();

		const blocks = Element.create("Folder", { Name: "Blocks" });
		blocks.Parent = plot.instance;

		return blocks;
	}
}

class ServerPlotController extends Controller {
	static tryCreate(player: Player) {
		const plot = Stuff.tryGetFreePlot();
		if (!plot) {
			player.Kick("No free plot found, try again later");
			return;
		}

		return new ServerPlotController(player, plot);
	}

	private readonly blocks;

	constructor(
		readonly player: Player,
		readonly plot: SharedPlot,
	) {
		super();

		plot.ownerId.set(player.UserId);
		player.RespawnLocation = plot.instance.WaitForChild("SpawnLocation") as SpawnLocation;

		this.blocks = Stuff.initializeBlocksFolder(plot);

		this.event.subscribe(Players.PlayerRemoving, (player) => {
			if (player !== this.player) return;
			this.destroy();
		});
		this.onDestroy(() => {
			Stuff.savePlot(player, plot);
			Stuff.resetPlot(plot);
		});
	}
}
export type { ServerPlotController };

// Floating username+image controller
for (const plot of SharedPlots.plots) {
	const controller = new PlotFloatingImageController(plot);
	controller.enable();
}

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
	initializeSpawnLocation(plot);
}

export namespace ServerPlots {
	const controllersByPlot = new Map<PlotModel, ServerPlotController>();
	const controllers = PlayersController.createContainer((player) => {
		const controller = ServerPlotController.tryCreate(player);
		if (controller) {
			controllersByPlot.set(controller.plot.instance, controller);
			controller.onDestroy(() => controllersByPlot.delete(controller.plot.instance));
		}

		return controller;
	});

	/** Empty method to trigger initialization */
	export function initialize() {}

	export function tryGetController(plot: PlotModel): ServerPlotController | undefined {
		return controllersByPlot.get(plot);
	}
}
