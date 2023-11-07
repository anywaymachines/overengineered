import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export default class MoveEvent {
	static initialize(): void {
		Logger.info("Loading Move event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("PlayerMove", (player, data) =>
			this.playerMove(player, data),
		);
	}

	private static playerMove(player: Player, data: PlayerMoveRequest): BuildResponse {
		const parentPlot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = parentPlot.WaitForChild("Blocks") as Model;

		const pivot = blocks.GetBoundingBox()[0];
		const size = blocks.GetExtentsSize();

		const blocksRegion = new Region3(
			new Vector3(
				pivot.Position.X - size.X / 2 + data.vector.X + 1,
				pivot.Position.Y - size.Y / 2 + data.vector.Y + 1,
				pivot.Position.Z - size.Z / 2 + data.vector.Z + 1,
			),
			new Vector3(
				pivot.Position.X + size.X / 2 + data.vector.X - 1,
				pivot.Position.Y + size.Y / 2 + data.vector.Y - 1,
				pivot.Position.Z + size.Z / 2 + data.vector.Z - 1,
			),
		);

		if (!VectorUtils.isRegion3InRegion3(blocksRegion, SharedPlots.getPlotBuildingRegion(parentPlot))) {
			return {
				success: false,
				message: "Out of bonds!",
			};
		}

		blocks.PivotTo(blocks.GetPivot().add(data.vector));

		return {
			success: true,
		};
	}
}
