import { AES, Base64 } from "@rbxts/crypto";
import { HttpService, RunService, Workspace } from "@rbxts/services";
import AESKeyGenerator from "shared/data/AESKeyGenerator";
import VectorUtils from "shared/utils/VectorUtils";

export default class PlotManager {
	public static plots = Workspace.Plots.GetChildren();

	/** Function for reading encoded Plot data inside `Model`
	 * @param plot The Plot model to read
	 */
	public static readPlotData(plot: Model): Plot {
		const encryptedPlotData = plot.GetAttribute("data") as string;
		const decryptedData = AES.Decrypt(Base64.Decode(encryptedPlotData), AESKeyGenerator.RANDOM_KEY);
		const data = HttpService.JSONDecode(decryptedData) as Plot;
		return data;
	}

	/** Returns the `Model` of Plot where the given `UserId` is the owner
	 * @param ownerID The `UserId` of the Plot owner
	 */
	public static getPlotByOwnerID(ownerID: number): Model {
		return this.plots.find((plot) => {
			return this.readPlotData(plot as Model).ownerID === ownerID;
		}) as Model;
	}

	/** Checks that building for a player on a given Plot is allowed
	 * @param plot The Plot to check
	 * @param player The player to check
	 */
	public static isBuildingAllowed(plot: Model, player: Player) {
		const data = this.readPlotData(plot);
		return data.ownerID === player.UserId || data.whitelistedPlayerIDs.includes(player.UserId);
	}

	/** Gets the `Model` of **Plot** at the given position that intersects with it
	 * @param position The position to check
	 */
	public static getPlotByPosition(position: Vector3): Model | undefined {
		for (let i = 0; i < PlotManager.plots.size(); i++) {
			const plot = this.plots[i];
			if (VectorUtils.isInRegion3(this.getPlotBuildingRegion(plot as Model), position) === true) {
				return plot as Model;
			}
		}
		return undefined;
	}

	/** Check that the position for a given player is a permitted position
	 * @param position The position to check
	 * @param player The player to check
	 */
	public static vectorAbleToPlayer(position: Vector3, player: Player): boolean {
		const plot = PlotManager.getPlotByPosition(position);
		return plot !== undefined && PlotManager.isBuildingAllowed(plot, player);
	}

	/** Returns the `Region3` of the **construction area** for blocks
	 * @param plot The plot to get the region of
	 */
	private static getPlotBuildingRegion(plot: Model) {
		const buildingPlane = plot.PrimaryPart as BasePart;
		const region = new Region3(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2 + 1,
				buildingPlane.Position.Y,
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
