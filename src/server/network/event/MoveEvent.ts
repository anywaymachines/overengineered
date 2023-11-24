import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export default class MoveEvent {
	static initialize(): void {
		Logger.info("Loading Move event listener...");

		Remotes.Server.GetNamespace("Building").OnFunction("MoveRequest", (player, data) =>
			this.playerMove(player, data),
		);
	}

	private static playerMove(player: Player, data: PlayerMoveRequest): BuildResponse {
		const parentPlot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = parentPlot.WaitForChild("Blocks") as Model;

		const pivot = blocks.GetBoundingBox()[0];
		const size = blocks.GetExtentsSize();

		function gridRound(value: number) {
			return math.round(value * 2) / 2;
		}

		const blocksRegion = new Region3(
			new Vector3(
				gridRound(pivot.Position.X - size.X / 2 + data.vector.X + 1),
				gridRound(pivot.Position.Y - size.Y / 2 + data.vector.Y + 1),
				gridRound(pivot.Position.Z - size.Z / 2 + data.vector.Z + 1),
			),
			new Vector3(
				gridRound(pivot.Position.X + size.X / 2 + data.vector.X - 1),
				gridRound(pivot.Position.Y + size.Y / 2 + data.vector.Y - 1),
				gridRound(pivot.Position.Z + size.Z / 2 + data.vector.Z - 1),
			),
		);

		if (!VectorUtils.isRegion3InRegion3(blocksRegion, SharedPlots.getPlotBuildingRegion(parentPlot))) {
			return {
				success: false,
				message: "Out of bounds!",
			};
		}

		blocks.PivotTo(blocks.GetPivot().add(data.vector));

		return {
			success: true,
		};
	}
}
