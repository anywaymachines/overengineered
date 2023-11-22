import Signals from "client/event/Signals";
import Remotes from "shared/Remotes";
import LogStaticWidget from "client/gui/widget/static/LogStaticWidget";

export default class BuildingController {
	public static async placeBlock(data: PlaceBlockRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("PlaceBlockRequest").CallServerAsync(data);

		if (response.success) {
			while (response.model?.PrimaryPart === undefined) {
				task.wait();
			}

			Signals.BLOCKS.ADDED.Fire(response.model);
			return { success: true, position: response.model.GetPivot().Position } as const;
		} else {
			LogStaticWidget.instance.addLine("Placement failed: " + response.message, Color3.fromRGB(255, 100, 100));

			// not OK
			return { success: false } as const;
		}
	}

	public static async deleteBlock(block: Model) {
		// Send block removing packet
		const response = await Remotes.Client.GetNamespace("Building").Get("DeleteBlockRequest").CallServerAsync({
			block: block,
		});

		if (response.success) {
			Signals.BLOCKS.REMOVED.Fire(block);
		} else {
			// Block not removed
			LogStaticWidget.instance.addLine("Delete failed: " + response.message, Color3.fromRGB(255, 100, 100));
		}

		return response;
	}

	public static async moveBlock(request: PlayerMoveRequest) {
		const response = await Remotes.Client.GetNamespace("Building").Get("MoveRequest").CallServerAsync(request);

		if (response.success) Signals.CONTRAPTION.MOVED.Fire(request.vector);
		else LogStaticWidget.instance.addLine("Move failed: " + response.message, Color3.fromRGB(255, 100, 100));

		return response;
	}

	public static async clearPlot() {
		const response = await Remotes.Client.GetNamespace("Building").Get("ClearAllRequest").CallServerAsync();

		if (response.success) Signals.CONTRAPTION.CLEARED.Fire();
		else
			LogStaticWidget.instance.addLine("Clearing all failed: " + response.message, Color3.fromRGB(255, 100, 100));

		return response;
	}
}
