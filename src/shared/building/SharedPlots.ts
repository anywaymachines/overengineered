import { Workspace } from "@rbxts/services";
import GameDefinitions from "shared/data/GameDefinitions";
import { AABB } from "shared/fixes/AABB";
import BlockManager, { PlacedBlockData } from "./BlockManager";
import { SharedPlot } from "./SharedPlot";

const plots = (Workspace.Plots.GetChildren() as unknown as PlotModel[])
	.map((p) => new SharedPlot(p).with((c) => c.enable()))
	.sort((left, right) => left.instance.Name < right.instance.Name);
const plotComponents: ReadonlyMap<PlotModel, SharedPlot> = new Map(plots.map((p) => [p.instance, p]));

/** Methods for reading the plots data */
const SharedPlots = {
	plots: plots as readonly SharedPlot[],

	/** Checks if the provided `Instance` is a plot model */
	isPlot: (model: Instance | undefined): model is PlotModel => {
		return model?.Parent === Workspace.Plots;
	},

	/** Checks if the provided `Instance` is a plot model blocks */
	isPlotBlocks: (model: Instance | undefined): model is PlotBlocks => {
		return model !== undefined && SharedPlots.isPlot(model?.Parent) && model.Name === "Blocks";
	},

	/** Checks if the provided block is on a plot that is allowed for the provided player */
	isBlockOnAllowedPlot: (player: Player, block: BlockModel): boolean => {
		const plot = SharedPlots.getPlotByBlock(block);
		if (!plot) return false;

		return SharedPlots.isBuildingAllowed(plot, player);
	},

	/** Checks if player is allowed to build on the prodived plot */
	isBuildingAllowed: (plot: PlotModel, player: Player): boolean => {
		return plotComponents.get(plot)!.isBuildingAllowed(player);
	},

	/** Returns the player owned plot, if exists */
	tryGetPlotByOwnerID: (ownerID: number): SharedPlot | undefined => {
		for (const plot of SharedPlots.plots) {
			if (plot.ownerId.get() === ownerID) {
				return plot;
			}
		}

		return undefined;
	},

	/** Returns the player owned plot */
	getPlotComponentByOwnerID: (ownerID: number): SharedPlot => {
		const plot = SharedPlots.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	},

	/** Returns the player owned plot */
	getPlotByOwnerID: (ownerID: number): PlotModel => {
		return SharedPlots.getPlotComponentByOwnerID(ownerID).instance;
	},

	/** Returns the plot by position inside it, if exists
	 * @deprecated slow
	 */
	getPlotByPosition: (position: Vector3): PlotModel | undefined => {
		return SharedPlots.plots.find((p) => SharedPlots.getPlotBuildingRegion(p.instance).contains(position))
			?.instance;
	},
	/** Returns the `PlotModel` by the given block or block part, if valid */
	getPlotByBlock: (instance: Instance): PlotModel | undefined => {
		if (!instance) {
			return undefined;
		}

		{
			const fastcheck = instance.IsA("Model") ? instance.Parent?.Parent : undefined;
			if (fastcheck && SharedPlots.isPlot(fastcheck)) {
				return fastcheck;
			}
		}

		let parent = instance.Parent;
		while (parent) {
			if (SharedPlots.isPlot(parent)) {
				return parent;
			}

			parent = parent.Parent;
		}

		return undefined;
	},

	/** Returns an `Instance` that holds plot blocks */
	getPlotBlocks: (plot: PlotModel): PlotBlocks => {
		return plot.Blocks;
	},

	/** Returns the block by its uuid */
	getBlockByUuid: (plot: PlotModel, uuid: BlockUuid): BlockModel => {
		return (plot.Blocks as unknown as Record<BlockUuid, BlockModel>)[uuid];
	},
	/** Returns the block by its uuid */
	tryGetBlockByUuid: (plot: PlotModel, uuid: BlockUuid): BlockModel | undefined => {
		return plot.Blocks.FindFirstChild(uuid) as BlockModel | undefined;
	},

	/** Returns the block by its uuid, checks every plot */
	getBlockByUuidOnAnyPlot: (uuid: BlockUuid): BlockModel => {
		const block = SharedPlots.tryGetBlockByUuidOnAnyPlot(uuid);
		if (!block) throw `Block ${uuid} was not found on any plot`;

		return block;
	},
	/** Returns the block by its uuid, checks every plot */
	tryGetBlockByUuidOnAnyPlot: (uuid: BlockUuid): BlockModel | undefined => {
		for (const plot of SharedPlots.plots) {
			const block = SharedPlots.tryGetBlockByUuid(plot.instance, uuid);
			if (block) return block;
		}
	},

	/** Returns `PlacedBlockData` for all blocks on the plot */
	getPlotBlockDatas: (plot: PlotModel): readonly PlacedBlockData[] => {
		return plot.Blocks.GetChildren(undefined).map((b) => BlockManager.getBlockDataByBlockModel(b));
	},

	/** Returns the {@link AABB} of the **construction area** for blocks */
	getPlotBuildingRegion: (plot: PlotModel): AABB => {
		const buildingPlane = plot.PrimaryPart;

		return AABB.fromMinMax(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2,
				buildingPlane.Position.Y + buildingPlane.Size.Y / 2,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2,
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2,
				buildingPlane.Position.Y + GameDefinitions.BUILD_HEIGHT_LIMIT,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2,
			),
		);
	},
} as const;

export default SharedPlots;
