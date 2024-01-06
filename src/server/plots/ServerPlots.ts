import { HttpService, Players } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";

/** A class that is designed to manage **Plots** where players can build */
export default class ServerPlots {
	public static initialize(): void {
		this.initializePlots();
		this.initializeEvents();
	}

	private static createDefaultPlotData(): PlotData {
		return {
			ownerID: 0,
			whitelistedPlayerIDs: [],
			blacklistedPlayerIDs: [],
		};
	}

	/** Function for writing and encoding Plot data to `Model`
	 * @param plot The Plot model
	 * @param plotData The Plot data to write
	 */
	public static writePlotData(plot: PlotModel, plotData: PlotData) {
		plot.SetAttribute("data", HttpService.JSONEncode(plotData));
	}

	/** Initialization part */
	private static initializePlots(): void {
		SharedPlots.plots.forEach((plot) => {
			this.writePlotData(plot, this.createDefaultPlotData());
		});
	}

	/** Initialization part */
	private static initializeEvents(): void {
		Players.PlayerAdded.Connect((player) => this.assignPlotTo(player));
		Players.PlayerRemoving.Connect((player) => this.resetPlotOf(player));
	}

	private static assignPlotTo(player: Player): void {
		try {
			const plot = this.getFreePlot();
			const data = this.createDefaultPlotData();
			data.ownerID = player.UserId;
			this.writePlotData(plot, data);

			// Add persistant player
			const blocks = plot.FindFirstChild("Blocks") as Model;
			blocks.AddPersistentPlayer(player);
		} catch {
			player.Kick("No free plot found, try again later");
		}
	}

	public static getFreePlot(): PlotModel {
		const plot = SharedPlots.plots.find((plot) => {
			return SharedPlots.readPlotData(plot).ownerID === 0;
		});

		if (!plot) throw "No free plot available";
		return plot;
	}

	public static clearAllBlocks(plot: PlotModel) {
		plot.Blocks.ClearAllChildren();
	}

	private static resetPlotOf(player: Player): void {
		try {
			const plot = SharedPlots.getPlotByOwnerID(player.UserId);
			this.clearAllBlocks(plot);
			this.writePlotData(plot, this.createDefaultPlotData());

			// Remove persistant player
			const blocks = plot.FindFirstChild("Blocks") as Model;
			blocks.RemovePersistentPlayer(player);
		} catch {
			// empty
		}
	}
}
