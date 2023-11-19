import BuildingWelder from "client/BuildingWelder";
import Signals from "client/event/Signals";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";

export default class BuildingController {
	public static async placeBlock(data: PlayerPlaceBlockRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").CallServerAsync(data);

		if (response.success) {
			while (response.model?.PrimaryPart === undefined) {
				task.wait();
			}

			// Create welds
			BuildingWelder.makeJoints(response.model as Model);

			Signals.BLOCKS.ADDED.Fire(response.model);
			return { success: true, position: response.model.GetPivot().Position } as const;
		} else {
			Logger.info("[BUILDING] Block placement failed: " + response.message);

			// not OK
			return { success: false } as const;
		}
	}

	public static async deleteBlock(block: Model) {
		// Send block removing packet
		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerDeleteBlock").CallServerAsync({
			block: block,
		});

		if (response.success) {
			Signals.BLOCKS.REMOVED.Fire(block);
		} else {
			// Block not removed
			Logger.info("[DELETING] Block deleting failed: " + response.message);
		}

		return response;
	}

	public static async moveBlock(request: PlayerMoveRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerMove").CallServerAsync(request);

		if (response.success) Signals.CONTRAPTION.MOVED.Fire(request.vector);
		else Logger.info("[MOVING] Move failed: " + response.message);

		return response;
	}

	public static async clearPlot() {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerClearAll").CallServerAsync();

		if (response.success) Signals.CONTRAPTION.CLEARED.Fire();
		else Logger.info("[DELETING] Clearing all blocks failed: " + response.message);

		return response;
	}
}
