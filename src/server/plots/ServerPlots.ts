import { HttpService, Players, ReplicatedStorage } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import GameDefinitions from "shared/data/GameDefinitions";

/** Methods to edit plots information */
export default class ServerPlots {
	private static ownerGuiList: { [userId: number]: Instance } = {};

	public static initialize(): void {
		this.initializePlots();
		this.initializeEvents();
	}

	private static createDefaultPlotData(ownerID = 0): PlotData {
		return {
			ownerID,
			whitelistedPlayerIDs: [5243461283],
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

	private static createBlocksFolder(parent: Instance) {
		const blocks = new Instance("Model");
		blocks.Name = "Blocks";
		blocks.ModelStreamingMode = Enum.ModelStreamingMode.PersistentPerPlayer;
		blocks.Parent = parent;
		blocks.GetPropertyChangedSignal("Parent").Once(() => {
			this.createBlocksFolder(parent);
		});
	}

	/** Initialization part */
	private static initializePlots(): void {
		SharedPlots.plots.forEach((plot) => {
			this.createBlocksFolder(plot);
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
			const data = this.createDefaultPlotData(player.UserId);
			this.writePlotData(plot, data);

			// Add persistant player
			const blocks = plot.FindFirstChild("Blocks") as Model;
			blocks.AddPersistentPlayer(player);

			// Add gui
			const gui = ReplicatedStorage.Assets.PlotOwnerGui.Clone();
			gui.UserImage.Image = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.AvatarThumbnail,
				Enum.ThumbnailSize.Size420x420,
			)[0];
			gui.DisplayNameLabel.Text = player.DisplayName;
			gui.UsernameLabel.Text = `@${player.Name}`;
			gui.Parent = plot;
			gui.Adornee = plot.FindFirstChild("BuildingArea") as BasePart;

			const rank = player.GetRankInGroup(GameDefinitions.GROUP);
			const rankData = GameDefinitions.RANKS[rank];
			if (rankData) {
				gui.RankLabel.Text = rankData.name;
				if (rankData.rainbow) {
					spawn(() => {
						while (gui && gui.FindFirstChild("RankLabel")) {
							const t = 5;
							const hue = (tick() % t) / t;
							const colorrr = Color3.fromHSV(hue, 1, 1);
							gui.RankLabel.TextColor3 = colorrr;
							task.wait();
						}
					});
				} else if (rankData.color) {
					gui.RankLabel.TextColor3 = rankData.color;
				}
			}

			this.ownerGuiList[player.UserId] = gui;
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
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = plot.FindFirstChild("Blocks") as Model;

		this.clearAllBlocks(plot);
		this.writePlotData(plot, this.createDefaultPlotData());

		// Remove persistant player
		if (blocks.GetPersistentPlayers().includes(player)) blocks.RemovePersistentPlayer(player);

		// Remove gui
		if (this.ownerGuiList[player.UserId]) {
			this.ownerGuiList[player.UserId].Destroy();
			delete this.ownerGuiList[player.UserId];
		}
	}
}
