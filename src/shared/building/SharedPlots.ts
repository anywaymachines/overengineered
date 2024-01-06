import { HttpService, Workspace } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";
import VectorUtils from "shared/utils/VectorUtils";

export default class SharedPlots {
	public static readonly plots = Workspace.Plots.GetChildren() as unknown as readonly PlotModel[];

	static isPlot(model: Instance): model is PlotModel {
		return model?.Parent === Workspace.Plots;
	}

	static getAllowedPlots(player: Player) {
		const data: PlotModel[] = [];
		for (let i = 0; i < this.plots.size(); i++) {
			const plot = data[i];
			if (!plot) {
				continue;
			}

			if (
				this.readPlotData(plot).ownerID === player.UserId ||
				this.readPlotData(plot).whitelistedPlayerIDs.includes(player.UserId)
			) {
				data.push(plot);
			}
		}
		return data;
	}

	/** Function for reading encoded Plot data inside `Model`
	 * @param plot The Plot model to read
	 */
	public static readPlotData(plot: PlotModel): PlotData {
		return HttpService.JSONDecode(plot.GetAttribute("data") as string) as PlotData;
	}

	/** Returns the `Model` of Plot where the given `UserId` is the owner
	 * @param ownerID The `UserId` of the Plot owner
	 */
	public static tryGetPlotByOwnerID(ownerID: number): PlotModel | undefined {
		return this.plots.find((plot) => {
			return this.readPlotData(plot).ownerID === ownerID;
		});
	}

	/** Returns the `Model` of Plot where the given `UserId` is the owner
	 * @param ownerID The `UserId` of the Plot owner
	 */
	public static getPlotByOwnerID(ownerID: number): PlotModel {
		const plot = this.plots.find((plot) => {
			return this.readPlotData(plot).ownerID === ownerID;
		});
		if (!plot) throw `Player ${ownerID} does not have a plot`;

		return plot;
	}

	/** Gets the `Model` of **Plot** at the given position that intersects with it
	 * @param position The position to check
	 */
	public static getPlotByPosition(position: Vector3): PlotModel | undefined {
		for (let i = 0; i < SharedPlots.plots.size(); i++) {
			const plot = this.plots[i];
			if (VectorUtils.isInRegion3(this.getPlotBuildingRegion(plot), position) === true) {
				return plot;
			}
		}
		return undefined;
	}

	/** Gets the `PlotModel` by the given block or block part */
	public static getPlotByBlock(instance: Instance): PlotModel | undefined {
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

	public static getPlotBlocks(plot: PlotModel): PlotBlocks {
		let model = plot.Blocks;

		if (!model) {
			model = new Instance("Model") as PlotBlocks;
			model.Name = "Blocks";
			model.Parent = plot;
		}

		return model;
	}

	/** Returns the `Region3` of the **construction area** for blocks
	 * @param plot The plot to get the region of
	 */
	public static getPlotBuildingRegion(plot: PlotModel) {
		const buildingPlane = plot.PrimaryPart as BasePart;
		const region = new Region3(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2 + 1,
				buildingPlane.Position.Y + buildingPlane.Size.Y / 2 + 1,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2 + 1,
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2 - 1,
				buildingPlane.Position.Y + GameDefinitions.BUILD_HEIGHT_LIMIT,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2 - 1,
			),
		);

		return region;
	}
}
