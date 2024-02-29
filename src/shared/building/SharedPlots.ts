import { Workspace } from "@rbxts/services";
import GameDefinitions from "shared/data/GameDefinitions";
import VectorUtils from "shared/utils/VectorUtils";
import BlockManager, { PlacedBlockData } from "./BlockManager";
import { SharedPlot } from "./SharedPlot";

const plots = (Workspace.Plots.GetChildren() as unknown as PlotModel[])
	.map((p) => new SharedPlot(p).with((c) => c.enable()))
	.sort((left, right) => left.instance.Name < right.instance.Name);
const plotComponents: ReadonlyMap<PlotModel, SharedPlot> = new Map(plots.map((p) => [p.instance, p]));

/** Methods for reading the plots data */
export default class SharedPlots {
	static readonly plots = plots;

	/** Checks if the provided `Instance` is a plot model */
	static isPlot(model: Instance | undefined): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	/** Checks if the provided `Instance` is a plot model blocks */
	static isPlotBlocks(model: Instance | undefined): model is PlotBlocks {
		return model !== undefined && this.isPlot(model?.Parent) && model.Name === "Blocks";
	}

	/** Checks if the provided block is on a plot that is allowed for the provided player */
	static isBlockOnAllowedPlot(player: Player, block: BlockModel): boolean {
		const plot = this.getPlotByBlock(block);
		if (!plot) return false;

		return this.isBuildingAllowed(plot, player);
	}

	/** Checks if player is allowed to build on the prodived plot */
	static isBuildingAllowed(plot: PlotModel, player: Player): boolean {
		return plotComponents.get(plot)!.isBuildingAllowed(player);
	}

	/** Returns the player owned plot, if exists */
	static tryGetPlotByOwnerID(ownerID: number): SharedPlot | undefined {
		for (const plot of this.plots) {
			if (plot.ownerId.get() === ownerID) {
				return plot;
			}
		}

		return undefined;
	}

	/** Returns the player owned plot */
	static getPlotComponentByOwnerID(ownerID: number): SharedPlot {
		const plot = this.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Returns the player owned plot */
	static getPlotByOwnerID(ownerID: number): PlotModel {
		return this.getPlotComponentByOwnerID(ownerID).instance;
	}

	/** Returns the plot by position inside it, if exists
	 * @deprecated slow
	 */
	static getPlotByPosition(position: Vector3): PlotModel | undefined {
		return this.plots.find((p) => VectorUtils.isInRegion3(this.getPlotBuildingRegion(p.instance), position))
			?.instance;
	}

	/** Returns the `PlotModel` by the given block or block part, if valid */
	static getPlotByBlock(instance: Instance): PlotModel | undefined {
		if (!instance) {
			return undefined;
		}

		{
			const fastcheck = instance.IsA("Model") ? instance.Parent?.Parent : undefined;
			if (fastcheck && this.isPlot(fastcheck)) {
				return fastcheck;
			}
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
