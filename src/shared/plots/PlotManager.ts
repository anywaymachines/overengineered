import { AES, Base64 } from "@rbxts/crypto";
import { HttpService, RunService, Workspace } from "@rbxts/services";
import AESKeyGenerator from "shared/data/AESKeyGenerator";
import VectorUtils from "shared/utils/VectorUtils";

export default class PlotManager {
	public static plots = Workspace.Plots.GetChildren();

	public static readPlotData(plot: Model): Plot {
		const encryptedPlotData = plot.GetAttribute("data") as string;
		const decryptedData = AES.Decrypt(Base64.Decode(encryptedPlotData), AESKeyGenerator.RANDOM_KEY);
		const data = HttpService.JSONDecode(decryptedData) as Plot;
		return data;
	}

	public static getPlotByOwnerID(ownerID: number): Model {
		return this.plots.find((plot) => {
			return this.readPlotData(plot as Model).ownerID === ownerID;
		}) as Model;
	}

	public static getPlotData(plot: Model): Plot {
		const data = this.readPlotData(plot);
		return data;
	}

	public static isBuildingAllowed(plot: Model, player: Player) {
		const data = this.readPlotData(plot);
		return data.ownerID === player.UserId || data.whitelistedPlayerIDs.includes(player.UserId);
	}

	public static getPlotByPosition(position: Vector3): Model | undefined {
		for (let i = 0; i < PlotManager.plots.size(); i++) {
			const plot = this.plots[i];
			if (VectorUtils.isInRegion3(this.getPlotBuildingRegion(plot as Model), position) === true) {
				return plot as Model;
			}
		}
		return undefined;
	}

	public static vectorAbleToPlayer(position: Vector3, player: Player): boolean {
		const plot = PlotManager.getPlotByPosition(position);
		return plot !== undefined && PlotManager.isBuildingAllowed(plot, player);
	}

	private static getPlotBuildingRegion(plot: Model) {
		const buildingPlane = plot.PrimaryPart as BasePart;
		const region = new Region3(
			new Vector3(
				buildingPlane.Position.X - buildingPlane.Size.X / 2 + 1 - (RunService.IsServer() ? 0.5 : 0),
				buildingPlane.Position.Y,
				buildingPlane.Position.Z - buildingPlane.Size.Z / 2 + 1 - (RunService.IsServer() ? 0.5 : 0),
			),
			new Vector3(
				buildingPlane.Position.X + buildingPlane.Size.X / 2 - 1 + (RunService.IsServer() ? 0.5 : 0),
				buildingPlane.Position.Y + 100,
				buildingPlane.Position.Z + buildingPlane.Size.Z / 2 - 1 + (RunService.IsServer() ? 0.5 : 0),
			),
		);

		return region;
	}
}
