import { AES, Base64 } from "@rbxts/crypto";
import { HttpService, Players } from "@rbxts/services";
import AESKeyGenerator from "shared/data/AESKeyGenerator";
import PlotManager from "shared/plots/PlotManager";

/** A class that is designed to manage **Plots** where players can build */
export default class ServerPlotsController {
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
		const encryptedPlotData = Base64.Encode(
			AES.Encrypt(HttpService.JSONEncode(plotData), AESKeyGenerator.RANDOM_KEY),
		);
		plot.SetAttribute("data", encryptedPlotData);
	}

	/** Initialization part */
	private static initializePlots(): void {
		PlotManager.plots.forEach((plot) => {
			this.writePlotData(plot as Model, this.defaultPlotData);
		});
	}

	/** Initialization part */
	private static initializeEvents(): void {
		Players.PlayerAdded.Connect((player) => this.claimPlot(player));
		Players.PlayerRemoving.Connect((player) => this.unclaimPlot(player));
	}

	private static claimPlot(player: Player): void {
		const plot = this.getFreePlot();
		const data = this.defaultPlotData;
		data.ownerID = player.UserId;
		this.writePlotData(plot, data);
	}

	public static getFreePlot(): Model {
		return PlotManager.plots.find((plot) => {
			return PlotManager.readPlotData(plot as Model).ownerID === 0;
		}) as Model;
	}

	private static unclaimPlot(player: Player): void {
		const plot = PlotManager.getPlotByOwnerID(player.UserId);
		this.writePlotData(plot, this.defaultPlotData);
	}
}
