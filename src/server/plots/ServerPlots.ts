import { HttpService, Players } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";

/** A class that is designed to manage **Plots** where players can build */
export default class ServerPlots {
	public static initialize(): void {
		this.initializePlots();
		this.initializeEvents();
	}

	private static defaultPlotData: Plot = {
		ownerID: 0,
		whitelistedPlayerIDs: [],
		blacklistedPlayerIDs: [],
	};

	/** Function for writing and encoding Plot data to `Model`
	 * @param plot The Plot model
	 * @param plotData The Plot data to write
	 */
	public static writePlotData(plot: Model, plotData: Plot) {
		plot.SetAttribute("data", HttpService.JSONEncode(plotData));
	}

	/** Initialization part */
	private static initializePlots(): void {
		SharedPlots.plots.forEach((plot) => {
			this.writePlotData(plot as Model, this.defaultPlotData);
		});
	}

	/** Initialization part */
	private static initializeEvents(): void {
		Players.PlayerAdded.Connect((player) => this.assignPlotTo(player));
		Players.PlayerRemoving.Connect((player) => this.resetPlotOf(player));
	}

	private static assignPlotTo(player: Player): void {
		const plot = this.getFreePlot();
		const data = this.defaultPlotData;
		data.ownerID = player.UserId;
		this.writePlotData(plot, data);
	}

	public static getFreePlot(): Model {
		return SharedPlots.plots.find((plot) => {
			return SharedPlots.readPlotData(plot as Model).ownerID === 0;
		}) as Model;
	}

	public static clearAllBlocks(plot: Model) {
		const blocks = plot.FindFirstChild("Blocks");
		blocks?.ClearAllChildren();
	}

	private static resetPlotOf(player: Player): void {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);

		this.clearAllBlocks(plot);

		this.writePlotData(plot, this.defaultPlotData);
	}
}
