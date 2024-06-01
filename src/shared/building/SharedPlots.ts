import { Players, Workspace } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import type { PlacedBlockData } from "shared/building/BlockManager";
import type { AABB } from "shared/fixes/AABB";

Workspace.WaitForChild("Plots");

const count = Workspace.Plots.GetAttribute("count") as number | undefined;
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

/** Reading the plots data */
export class SharedPlots {
	static initialize() {
		const plots: readonly SharedPlot[] = (Workspace.Plots.GetChildren() as unknown as PlotModel[])
			.map((p) => new SharedPlot(p).with((c) => c.enable()))
			.sort((left, right) => left.instance.Name < right.instance.Name);
		const plotComponents: ReadonlyMap<PlotModel, SharedPlot> = new Map(plots.map((p) => [p.instance, p]));

		return new SharedPlots(plots, plotComponents);
	}

	constructor(
		readonly plots: readonly SharedPlot[],
		private readonly plotComponents: ReadonlyMap<PlotModel, SharedPlot>,
	) {}

	waitForPlot(userid: number) {
		while (!this.tryGetPlotByOwnerID(userid)) {
			task.wait(0.2);
		}

		return this.getPlotComponentByOwnerID(userid);
	}

	/** Checks if the provided `Instance` is a plot model */
	isPlot(model: Instance | undefined): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	/** Checks if the provided `Instance` is a plot model blocks */
	isPlotBlocks(model: Instance | undefined): model is PlotBlocks {
		return model !== undefined && this.isPlot(model?.Parent) && model.Name === "Blocks";
	}

	/** Checks if the provided block is on a plot that is allowed for the provided player */
	isBlockOnAllowedPlot(player: Player, block: BlockModel): boolean {
		const plot = this.getPlotByBlock(block);
		if (!plot) return false;

		return this.isBuildingAllowed(plot, player);
	}

	/** Checks if player is allowed to build on the prodived plot */
	isBuildingAllowed(plot: PlotModel, player: Player): boolean {
		return this.plotComponents.get(plot)!.isBuildingAllowed(player);
	}

	/** Returns the player owned plot, if exists */
	tryGetPlotByOwnerID(ownerID: number): SharedPlot | undefined {
		for (const plot of this.plots) {
			if (plot.ownerId.get() === ownerID) {
				return plot;
			}
		}

		return undefined;
	}

	/** Returns the plot component by the plot model */
	getPlotComponent(plot: PlotModel): SharedPlot {
		return this.plotComponents.get(plot)!;
	}

	/** Returns the player owned plot */
	getPlotComponentByOwnerID(ownerID: number): SharedPlot {
		const plot = this.tryGetPlotByOwnerID(ownerID);
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Returns the player owned plot */
	getPlotByOwnerID(ownerID: number): PlotModel {
		return this.getPlotComponentByOwnerID(ownerID).instance;
	}

	/** Returns the current player owned plot
	 * @client
	 */
	getOwnPlot(): SharedPlot {
		return this.getPlotComponentByOwnerID(Players.LocalPlayer.UserId);
	}

	/** Returns the plot by position inside it, if exists
	 * @deprecated slow
	 */
	getPlotByPosition(position: Vector3): PlotModel | undefined {
		return this.plots.find((p) => this.getPlotBuildingRegion(p.instance).contains(position))?.instance;
	}
	/** Returns the `PlotModel` by the given block or block part, if valid */
	getPlotByBlock(instance: Instance): PlotModel | undefined {
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

	/** Returns the block by its uuid */
	getBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel {
		return (plot.Blocks as unknown as Record<BlockUuid, BlockModel>)[uuid];
	}
	/** Returns the block by its uuid */
	tryGetBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel | undefined {
		return plot.Blocks.FindFirstChild(uuid) as BlockModel | undefined;
	}

	/** Returns the block by its uuid, checks every plot */
	getBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel {
		const block = this.tryGetBlockByUuidOnAnyPlot(uuid);
		if (!block) throw `Block ${uuid} was not found on any plot`;

		return block;
	}
	/** Returns the block by its uuid, checks every plot */
	tryGetBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel | undefined {
		for (const plot of this.plots) {
			const block = this.tryGetBlockByUuid(plot.instance, uuid);
			if (block) return block;
		}
	}

	/** Returns `PlacedBlockData` for all blocks on the plot */
	getPlotBlockDatas(plot: PlotModel): readonly PlacedBlockData[] {
		return plot.Blocks.GetChildren(undefined).map((b) => BlockManager.getBlockDataByBlockModel(b));
	}

	/** Returns the {@link AABB} of the **construction area** for blocks */
	getPlotBuildingRegion(plot: PlotModel): AABB {
		return this.getPlotComponent(plot).bounds;
	}
}
