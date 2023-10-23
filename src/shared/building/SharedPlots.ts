import { HttpService, Workspace } from "@rbxts/services";
import VectorUtils from "shared/utils/VectorUtils";

export default class SharedPlots {
	public static readonly plots = Workspace.Plots.GetChildren();

	/** Function for reading encoded Plot data inside `Model`
	 * @param plot The Plot model to read
	 */
	public static readPlotData(plot: Model): Plot {
		return HttpService.JSONDecode(plot.GetAttribute("data") as string) as Plot;
	}

	/** Returns the `Model` of Plot where the given `UserId` is the owner
	 * @param ownerID The `UserId` of the Plot owner
	 */
	public static getPlotByOwnerID(ownerID: number): Model {
		return this.plots.find((plot) => {
			return this.readPlotData(plot as Model).ownerID === ownerID;
		}) as Model;
	}

	/** Gets the `Model` of **Plot** at the given position that intersects with it
	 * @param position The position to check
	 */
	public static getPlotByPosition(position: Vector3): Model | undefined {
		for (let i = 0; i < SharedPlots.plots.size(); i++) {
			const plot = this.plots[i];
			if (VectorUtils.isInRegion3(this.getPlotBuildingRegion(plot as Model), position) === true) {
				return plot as Model;
			}
		}
		return undefined;
	}

	/** Returns the `Region3` of the **construction area** for blocks
	 * @param plot The plot to get the region of
	 */
	private static getPlotBuildingRegion(plot: Model) {
		const buildingPlane = plot.PrimaryPart as BasePart;
		const region = new Region3(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2 + 1,
				buildingPlane.Position.Y + buildingPlane.Size.Y / 2 + 1,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2 + 1,
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2 - 1,
				buildingPlane.Position.Y + 100,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2 - 1,
			),
		);

		return region;
	}
}
