import { Players, Workspace } from "@rbxts/services";
import { BlockManager, PlacedBlockData } from "shared/building/BlockManager";
import { AABB } from "shared/fixes/AABB";
import { SharedPlot } from "./SharedPlot";

Workspace.WaitForChild("Plots");

const count = Workspace.Plots.GetAttribute("count") as number;
if (Workspace.Plots.GetChildren().size() !== count) {
	print(
		`!! Target plot count ${count} is not equal to loaded plot count ${Workspace.Plots.GetChildren().size()}, waiting...`,
	);
}
while (Workspace.Plots.GetChildren().size() !== count) {
	task.wait();
}
for (const plot of Workspace.Plots.GetChildren()) {
	plot.WaitForChild("BuildingArea");
}

/** Methods for reading the plots data */
export namespace SharedPlots {
	export const plots: readonly SharedPlot[] = (Workspace.Plots.GetChildren() as unknown as PlotModel[])
		.map((p) => new SharedPlot(p).with((c) => c.enable()))
		.sort((left, right) => left.instance.Name < right.instance.Name);
	const plotComponents: ReadonlyMap<PlotModel, SharedPlot> = new Map(plots.map((p) => [p.instance, p]));

	//if (RunService.IsClient()) {
	//	waitForPlot(Players.LocalPlayer.UserId);
	//}

	export function waitForPlot(userid: number) {
		while (!tryGetPlotByOwnerID(userid)) {
			task.wait(0.2);
		}

		return getPlotComponentByOwnerID(userid);
	}

	/** Checks if the provided `Instance` is a plot model */
	export function isPlot(model: Instance | undefined): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	/** Checks if the provided `Instance` is a plot model blocks */
	export function isPlotBlocks(model: Instance | undefined): model is PlotBlocks {
		return model !== undefined && SharedPlots.isPlot(model?.Parent) && model.Name === "Blocks";
	}

	/** Checks if the provided block is on a plot that is allowed for the provided player */
	export function isBlockOnAllowedPlot(player: Player, block: BlockModel): boolean {
		const plot = SharedPlots.getPlotByBlock(block);
		if (!plot) return false;

		return SharedPlots.isBuildingAllowed(plot, player);
	}

	/** Checks if player is allowed to build on the prodived plot */
	export function isBuildingAllowed(plot: PlotModel, player: Player): boolean {
		return plotComponents.get(plot)!.isBuildingAllowed(player);
	}

	/** Returns the player owned plot, if exists */
	export function tryGetPlotByOwnerID(ownerID: number): SharedPlot | undefined {
		for (const plot of SharedPlots.plots) {
			if (plot.ownerId.get() === ownerID) {
				return plot;
			}
		}

		return undefined;
	}

	/** Returns the plot component by the plot model */
	export function getPlotComponent(plot: PlotModel): SharedPlot {
		return plotComponents.get(plot)!;
	}

	/** Returns the player owned plot */
	export function getPlotComponentByOwnerID(ownerID: number): SharedPlot {
		const plot = SharedPlots.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Returns the player owned plot */
	export function getPlotByOwnerID(ownerID: number): PlotModel {
		return SharedPlots.getPlotComponentByOwnerID(ownerID).instance;
	}

	/** Returns the current player owned plot
	 * @client
	 */
	export function getOwnPlot(): SharedPlot {
		return SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId);
	}

	/** Returns the plot by position inside it, if exists
	 * @deprecated slow
	 */
	export function getPlotByPosition(position: Vector3): PlotModel | undefined {
		return SharedPlots.plots.find((p) => SharedPlots.getPlotBuildingRegion(p.instance).contains(position))
			?.instance;
	}
	/** Returns the `PlotModel` by the given block or block part, if valid */
	export function getPlotByBlock(instance: Instance): PlotModel | undefined {
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
	}

	/** Returns the block by its uuid */
	export function getBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel {
		return (plot.Blocks as unknown as Record<BlockUuid, BlockModel>)[uuid];
	}
	/** Returns the block by its uuid */
	export function tryGetBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel | undefined {
		return plot.Blocks.FindFirstChild(uuid) as BlockModel | undefined;
	}

	/** Returns the block by its uuid, checks every plot */
	export function getBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel {
		const block = SharedPlots.tryGetBlockByUuidOnAnyPlot(uuid);
		if (!block) throw `Block ${uuid} was not found on any plot`;

		return block;
	}
	/** Returns the block by its uuid, checks every plot */
	export function tryGetBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel | undefined {
		for (const plot of SharedPlots.plots) {
			const block = SharedPlots.tryGetBlockByUuid(plot.instance, uuid);
			if (block) return block;
		}
	}

	/** Returns `PlacedBlockData` for all blocks on the plot */
	export function getPlotBlockDatas(plot: PlotModel): readonly PlacedBlockData[] {
		return plot.Blocks.GetChildren(undefined).map((b) => BlockManager.getBlockDataByBlockModel(b));
	}

	/** Returns the {@link AABB} of the **construction area** for blocks */
	export function getPlotBuildingRegion(plot: PlotModel): AABB {
		return SharedPlots.getPlotComponent(plot).bounds;
	}
}
