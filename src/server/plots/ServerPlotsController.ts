import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";

/** A class that is designed to manage **Plots** where players can build */
export default class ServerPlotsController {
	private static PLOTS: Array<Plot> = [];

	public static initialize() {
		Logger.info("[ServerPlotsController] Initializing..");
		this.initializePlots();
		this.initializeEvents();
	}

	/** The function parses all the Plots inside **Workspace.Plots** and stores them in memory to work with them later on */
	private static initializePlots() {
		Logger.info("[ServerPlotsController] Initializing plots...");

		const Plots = Workspace.Plots.GetChildren();
		Plots.forEach((plot: Instance) => {
			this.PLOTS.push({
				owner: undefined,
				whitelistedPlayers: [],
				blacklistedPlayers: [],
				__plotInstance: plot as Model,
			});
		});
	}

	/** Initialize **Plot** events so that they are automatically assigned a **Player** */
	private static initializeEvents() {
		Logger.info("[ServerPlotsController] Initializing events...");

		Players.PlayerAdded.Connect((player) => {
			this.claimFreePlot(player);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.unclaimPlot(player);
		});
	}

	/** Assigns **Plot** to the specified player
	 * @param player The player to assign the **Plot** to
	 */
	private static claimFreePlot(player: Player) {
		const freePlot = this.PLOTS.find((plot) => plot.owner === undefined);

		if (freePlot === undefined) {
			player.Kick("There are no plots available. Contact game developer.");
			return;
		}

		freePlot.owner = player;
	}

	/** Removes the specified player from the owner of **Plot**
	 * @param player The player to remove from the **Plot** owner
	 */
	private static unclaimPlot(player: Player): void {
		const plot = this.getPlotByPlayer(player);

		if (plot === undefined) {
			Logger.info("[ServerPlotsController] Plot of player " + player.Name + " not found.");
			return;
		}

		this.resetPlot(plot);
	}

	/** Makes all **Plot** values the default values
	 * @param plot The **Plot**
	 */
	private static resetPlot(plot: Plot): void {
		plot.owner = undefined;
		plot.blacklistedPlayers = [];
		plot.whitelistedPlayers = [];
	}

	/** Returns the **Plot** in which the specified player is the owner
	 * @param player The player
	 */
	public static getPlotByPlayer(player: Player): Plot | undefined {
		return this.PLOTS.find((plot) => plot.owner === player);
	}
}
