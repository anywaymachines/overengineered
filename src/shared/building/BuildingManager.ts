import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

// Looks good
export default class BuildingManager {
	/** Checks that building for a player on a given Plot is allowed
	 * @param plot The Plot to check
	 * @param player The player to check
	 */
	public static isBuildingAllowed(plot: Model, player: Player) {
		const data = SharedPlots.readPlotData(plot);
		return data.ownerID === player.UserId || data.whitelistedPlayerIDs.includes(player.UserId);
	}

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 */
	public static getBlockByPosition(vector: Vector3): Model | undefined {
		const plot = SharedPlots.getPlotByPosition(vector);
		if (!plot) {
			// No plot => No block
			return undefined;
		}

		const blocks = (plot.FindFirstChild("Blocks") as Folder).GetChildren();
		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;
			if (
				VectorUtils.roundVectorToNearestHalf(block.GetPivot().Position) ===
				VectorUtils.roundVectorToNearestHalf(vector)
			) {
				return block;
			}
		}

		return undefined;
	}

	/** Check that the position for a given player is a permitted position
	 * @param position The position to check
	 * @param player The player to check
	 */
	public static vectorAbleToPlayer(position: Vector3, player: Player): boolean {
		// Checking the plot
		const plot = SharedPlots.getPlotByPosition(position);
		if (plot === undefined || !this.isBuildingAllowed(plot, player)) {
			// No plot / Building forbidden
			return false;
		}

		// Check is given coordinate occupied by another block
		const collideBlock = this.getBlockByPosition(position);
		if (collideBlock !== undefined) {
			// Occupied coordinates
			return false;
		}

		// OK
		return true;
	}
}
