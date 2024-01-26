import { HttpService, Workspace } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";
import VectorUtils from "shared/utils/VectorUtils";
import BlockManager, { PlacedBlockData } from "./BlockManager";

/** Methods for reading the plots data */
export default class SharedPlots {
	static readonly plots = Workspace.Plots.GetChildren() as unknown as readonly PlotModel[];

	/** Checks if the provided `Instance` is a plot model */
	static isPlot(model: Instance | undefined): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	/** Read encoded plot data inside `Model` */
	static readPlotData(plot: PlotModel | PlotData): PlotData {
		return "IsA" in plot ? (HttpService.JSONDecode(plot.GetAttribute("data") as string) as PlotData) : plot;
	}

	/** Checks if player is allowed to build on the prodived plot */
	static isBuildingAllowed(plot: PlotModel | PlotData, player: Player) {
		plot = SharedPlots.readPlotData(plot);
		return plot.ownerID === player.UserId || plot.whitelistedPlayerIDs.includes(player.UserId);
	}

	/** Get plots that the provided player is allowed to build on */
	static getAllowedPlots(player: Player) {
		return this.plots.filter((p) => this.isBuildingAllowed(p, player));
	}

	/** Returns the player owned plot, if exists */
	static tryGetPlotByOwnerID(ownerID: number): PlotModel | undefined {
		return this.plots.find((plot) => {
			return this.readPlotData(plot).ownerID === ownerID;
		});
	}

	/** Returns the player owned plot */
	static getPlotByOwnerID(ownerID: number): PlotModel {
		const plot = this.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Returns the plot by position inside it, if exists
	 * @deprecated slow
	 */
	static getPlotByPosition(position: Vector3): PlotModel | undefined {
		return this.plots.find((p) => VectorUtils.isInRegion3(this.getPlotBuildingRegion(p), position));
	}

	/** Returns the `PlotModel` by the given block or block part, if valid */
	static getPlotByBlock(instance: Instance): PlotModel | undefined {
		if (!instance) {
			return undefined;
		}

		let parent = instance.Parent;
		while (parent) {
			if (this.isPlot(parent)) {
				return parent;
			}

			parent = parent.Parent;
		}

		return undefined;
	}

	/** Returns an `Instance` that holds plot blocks */
	static getPlotBlocks(plot: PlotModel): PlotBlocks {
		return plot.Blocks;
	}

	/** Returns `PlacedBlockData` for all blocks on the plot */
	static getPlotBlockDatas(plot: PlotModel): readonly PlacedBlockData[] {
		return plot.Blocks.GetChildren(undefined).map((b) => BlockManager.getBlockDataByBlockModel(b));
	}

	/** Returns the `Region3` of the **construction area** for blocks */
	static getPlotBuildingRegion(plot: PlotModel) {
		const buildingPlane = plot.PrimaryPart;

		return new Region3(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2,
				buildingPlane.Position.Y - buildingPlane.Size.Y / 2,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2,
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2,
				buildingPlane.Position.Y + GameDefinitions.BUILD_HEIGHT_LIMIT,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2,
			),
		);
	}
}
