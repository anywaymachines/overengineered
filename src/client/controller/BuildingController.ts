import Signals from "client/event/Signals";
import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";

export default class BuildingController {
	public static async placeBlock(data: PlaceBlockRequest): Promise<Response<{ position: Vector3 }>> {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlaceBlockRequest").CallServerAsync(data);

		if (response.success) {
			while (response.model?.PrimaryPart === undefined) {
				task.wait();
			}

			Signals.BLOCKS.BLOCK_ADDED.Fire(response.model);
			return { success: true, position: response.model.GetPivot().Position } as const;
		} else {
			LogControl.instance.addLine("Placement failed: " + response.message, Color3.fromRGB(255, 100, 100));
			return response;
		}
	}

	public static async deleteBlock(request: PlayerDeleteBlockRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("Delete").CallServerAsync(request);

		if (response.success) {
			if (request !== "all") {
				for (const block of request) {
					Signals.BLOCKS.BLOCK_REMOVED.Fire(block);
				}
			}
		} else {
			// Block not removed
			LogControl.instance.addLine("Delete failed: " + response.message, Color3.fromRGB(255, 100, 100));
		}

		return response;
	}

	public static async moveBlock(request: PlayerMoveRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("MoveRequest").CallServerAsync(request);

		if (response.success) Signals.BLOCKS.BLOCKS_MOVED.Fire(request.vector);
		else LogControl.instance.addLine("Move failed: " + response.message, Color3.fromRGB(255, 100, 100));

		return response;
	}
}
