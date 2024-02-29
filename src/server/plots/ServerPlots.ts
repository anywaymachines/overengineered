import { Players } from "@rbxts/services";
import { BuildingController } from "server/BuildingController";
import { Element } from "shared/Element";
import { SharedPlot } from "shared/building/SharedPlot";
import SharedPlots from "shared/building/SharedPlots";
import { PlotsFloatingImageController } from "./PlotsFloatingImageController";

/** Methods to edit plots information */
export default class ServerPlots {
	private static imageController: PlotsFloatingImageController;

	public static initialize(): void {
		this.initializeEvents();
		this.imageController = new PlotsFloatingImageController(SharedPlots.plots);
		this.imageController.enable();

		for (const plot of SharedPlots.plots) {
			this.initializeBlocksFolder(plot.instance);
		}
	}

	private static initializeBlocksFolder(plot: PlotModel) {
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
	}

	/** Initialization part */
	private static initializeEvents(): void {
		Players.PlayerAdded.Connect((player) => this.assignPlotTo(player));
		Players.PlayerRemoving.Connect((player) => this.resetPlotOf(player));
	}

	private static assignPlotTo(player: Player): void {
		try {
			const plot = this.getFreePlot();
			plot.ownerId.set(player.UserId);
			plot.instance.Blocks.AddPersistentPlayer(player);
		} catch {
			player.Kick("No free plot found, try again later");
		}
	}

	public static getFreePlot(): SharedPlot {
		const plot = SharedPlots.plots.find((p) => p.ownerId.get() === undefined);
		if (!plot) throw "No free plot available";

		return plot;
	}

	private static resetPlotOf(player: Player): void {
		const plot = SharedPlots.getPlotComponentByOwnerID(player.UserId);
		BuildingController.clearPlot(plot.instance);

		if (plot.instance.Blocks.GetPersistentPlayers().includes(player)) {
			plot.instance.Blocks.RemovePersistentPlayer(player);
		}

		plot.ownerId.set(undefined);
		plot.whitelistedPlayers.set([5243461283]);
		plot.blacklistedPlayers.set(undefined);
	}
}
