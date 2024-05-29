import { Players } from "@rbxts/services";
import { PlayersController } from "server/player/PlayersController";
import { BuildingPlot } from "server/plots/BuildingPlot";
import { PlotFloatingImageController } from "server/plots/PlotsFloatingImageController";
import { SharedPlots } from "shared/building/SharedPlots";
import { Controller } from "shared/component/Controller";
import { Element } from "shared/Element";
import { ArgsSignal } from "shared/event/Signal";
import type { SharedPlot } from "shared/building/SharedPlot";

class ServerPlotController extends Controller {
	static tryCreate(player: Player) {
		const tryGetFreePlot = (): SharedPlot | undefined =>
			SharedPlots.plots.find((p) => p.ownerId.get() === undefined);

		const plot = tryGetFreePlot();
		if (!plot) {
			player.Kick("No free plot found, try again later");
			return;
		}

		return new ServerPlotController(player, plot);
	}

	readonly blocks;

	constructor(
		readonly player: Player,
		readonly plot: SharedPlot,
	) {
		super();

		plot.ownerId.set(player.UserId);
		player.RespawnLocation = plot.instance.WaitForChild("SpawnLocation") as SpawnLocation;

		const initializeBlocksFolder = (plot: SharedPlot) => {
			plot.instance.FindFirstChild("Blocks")?.Destroy();

			const blocks = Element.create("Folder", { Name: "Blocks" });
			blocks.Parent = plot.instance;

			return blocks;
		};

		this.blocks = new BuildingPlot(
			initializeBlocksFolder(plot),
			plot,
			plot.instance.BuildingArea.ExtentsCFrame,
			plot.instance.BuildingArea.ExtentsSize,
		);

		this.event.subscribe(Players.PlayerRemoving, (player) => {
			if (player !== this.player) return;
			this.destroy();
		});
		this.onDestroy(() => {
			this.plot.ownerId.set(undefined);
			this.plot.whitelistedPlayers.set([5243461283]);
			this.plot.blacklistedPlayers.set(undefined);

			this.blocks.destroy();
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
	export const onAdded = new ArgsSignal<[controller: ServerPlotController]>();

	const controllersByPlot = new Map<PlotModel, ServerPlotController>();
	const controllers = PlayersController.createContainer((player) => {
		const controller = ServerPlotController.tryCreate(player);
		if (controller) {
			controllersByPlot.set(controller.plot.instance, controller);
			controller.onDestroy(() => controllersByPlot.delete(controller.plot.instance));

			onAdded.Fire(controller);
		}

		return controller;
	});

	/** Empty method to trigger initialization */
	export function initialize() {}

	export function tryGetControllerByPlayer(player: Player): ServerPlotController | undefined {
		return controllers.get(player);
	}
	export function tryGetController(plot: PlotModel): ServerPlotController | undefined {
		return controllersByPlot.get(plot);
	}
}
