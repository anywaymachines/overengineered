import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import LogControl from "client/gui/static/LogControl";
import Remotes from "shared/Remotes";

export default class BuildingController {
	static async placeBlocks(
		data: PlaceBlocksByPlayerRequest,
	): Promise<Response<{ readonly positions: readonly Vector3[] }>> {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlaceBlocks").CallServerAsync(data);

		if (response.success) {
			for (const model of response.models) {
				while (!model?.PrimaryPart) {
					task.wait();
				}

				Signals.BLOCKS.BLOCK_ADDED.Fire(model);
			}
		} else {
			LogControl.instance.addLine("Placement failed: " + response.message, Colors.red);
			return response;
		}

		return { success: true, positions: response.models.map((m) => m.GetPivot().Position) };
	}
	static async placeBlock(
		plot: PlotModel,
		data: PlaceBlockByPlayerRequest,
	): Promise<Response<{ position: Vector3 }>> {
		const result = await this.placeBlocks({
			plot,
			blocks: [data],
		});

		if (!result.success) {
			return result;
		}

		return {
			success: true,
			position: result.positions[0],
		};
	}

	static async deleteBlock(request: PlayerDeleteBlockRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("Delete").CallServerAsync(request);

		if (response.success) {
			if (request !== "all") {
				for (const block of request) {
					Signals.BLOCKS.BLOCK_REMOVED.Fire(block);
				}
			}
		} else {
			// Block not removed
			LogControl.instance.addLine("Delete failed: " + response.message, Colors.red);
		}

		return response;
	}

	static async moveBlock(request: PlayerMoveRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("MoveRequest").CallServerAsync(request);

		if (response.success) Signals.BLOCKS.BLOCKS_MOVED.Fire(request.vector);
		else LogControl.instance.addLine("Move failed: " + response.message, Colors.red);

		return response;
	}
}
