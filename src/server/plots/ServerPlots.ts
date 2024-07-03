import { Players } from "@rbxts/services";
import { BuildingPlot } from "server/plots/BuildingPlot";
import { PlotsFloatingImageController } from "server/plots/PlotsFloatingImageController";
import { Element } from "shared/Element";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { HostedService } from "shared/GameHost";
import { PlayerWatcher } from "shared/PlayerWatcher";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { SharedPlots } from "shared/building/SharedPlots";

@injectable
class ServerPlotController extends HostedService {
	static tryCreate(player: Player, di: DIContainer, plots: SharedPlots) {
		const tryGetFreePlot = (): SharedPlot | undefined => plots.plots.find((p) => p.ownerId.get() === undefined);

		const plot = tryGetFreePlot();
		if (!plot) {
			player.Kick("No free plot found, try again later");
			return;
		}

		return di.resolveForeignClass(ServerPlotController, [player, plot]);
	}

	readonly blocks;

	constructor(
		readonly player: Player,
		readonly plot: SharedPlot,
		@inject di: DIContainer,
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

		this.blocks = di.resolveForeignClass(BuildingPlot, [
			initializeBlocksFolder(plot),
			plot.instance.BuildingArea.GetPivot(),
			plot.bounds,
		]);

		this.event.subscribe(Players.PlayerRemoving, (player) => {
			if (player !== this.player) return;
			this.destroy();
		});
		this.onDestroy(() => {
			this.plot.ownerId.set(undefined);
			this.plot.whitelistedPlayers.set([5243461283]);
			this.plot.blacklistedPlayers.set(undefined);

			this.blocks.unparent();
			task.delay(1, () => this.blocks.destroy());
		});
	}
}
export type { ServerPlotController };

@injectable
export class ServerPlots extends HostedService {
	readonly controllers = new ObservableCollectionSet<ServerPlotController>();
	private readonly controllersByPlot = new Map<PlotModel, ServerPlotController>();
	private readonly controllersByPlayer = new Map<Player, ServerPlotController>();

	constructor(
		@inject di: DIContainer,
		@inject readonly plots: SharedPlots,
	) {
		super();

		this.parent(new PlotsFloatingImageController(plots));

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
		this.onEnable(() => {
			for (const plot of plots.plots) {
				initializeSpawnLocation(plot);
			}
		});

		this.event.subscribeCollectionAdded(
			PlayerWatcher.players,
			(player) => {
				const controller = ServerPlotController.tryCreate(player, di, plots);
				if (!controller) return;

				controller.onDestroy(() => {
					this.controllers.remove(controller);
					this.controllersByPlayer.delete(controller.player);
					this.controllersByPlot.delete(controller.plot.instance);
				});

				this.controllers.add(controller);
				this.controllersByPlot.set(controller.plot.instance, controller);
				this.controllersByPlayer.set(controller.player, controller);

				controller.enable();
			},
			true,
		);

		game.BindToClose(() => {
			$log("Game quit, destroying controllers...");

			for (const controller of this.controllers.get()) {
				$log("Destroying", controller.player.Name);
				controller.destroy();
			}
		});
	}

	tryGetControllerByPlayer(player: Player): ServerPlotController | undefined {
		return this.controllersByPlayer.get(player);
	}
	tryGetController(plot: PlotModel): ServerPlotController | undefined {
		return this.controllersByPlot.get(plot);
	}
}
