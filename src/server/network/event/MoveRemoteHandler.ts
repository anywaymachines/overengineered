import BaseRemoteHandler from "server/base/BaseRemoteHandler";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export default class MoveRemoteHandler extends BaseRemoteHandler {
	constructor() {
		super("move");

		Remotes.Server.GetNamespace("Building").OnFunction("MoveRequest", (player, data) => this.emit(player, data));
	}

	public emit(player: Player, data: PlayerMoveRequest): BuildResponse {
		const parentPlot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = parentPlot.WaitForChild("Blocks") as Model;

		const pivot = blocks.GetBoundingBox()[0];
		const size = blocks.GetExtentsSize();

		function gridRound(value: number) {
			return math.round(value * 2) / 2;
		}

		const p1 = pivot.PointToWorldSpace(size.div(2).mul(-1));
		const p2 = pivot.PointToWorldSpace(size.div(2));

		const min = new Vector3(
			gridRound(math.min(p1.X, p2.X)),
			gridRound(math.min(p1.Y, p2.Y)),
			gridRound(math.min(p1.Z, p2.Z)),
		)
			.add(data.vector)
			.add(Vector3.one);
		const max = new Vector3(
			gridRound(math.max(p1.X, p2.X)),
			gridRound(math.max(p1.Y, p2.Y)),
			gridRound(math.max(p1.Z, p2.Z)),
		)
			.add(data.vector)
			.sub(Vector3.one);

		const blocksRegion = new Region3(min, max);

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
