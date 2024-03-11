import ActionController from "client/modes/build/ActionController";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";

/** Methods to send building requests to the server, with undo/redo support */
export const ClientBuilding = {
	deleteBlocks: (plot: PlotModel, _blocks: readonly BlockModel[] | "all") => {
		const uuids = _blocks === "all" ? "all" : _blocks.map((b) => BlockManager.getBlockDataByBlockModel(b).uuid);
		const undo: PlaceBlocksByPlayerRequest = {
			plot,
			blocks: (_blocks === "all" ? plot.Blocks.GetChildren(undefined) : _blocks).map(
				(block): PlaceBlockByPlayerRequest => {
					const data = BlockManager.getBlockDataByBlockModel(block);
					return {
						id: data.id,
						location: block.GetPivot(),
						color: data.color,
						material: data.material,
						uuid: data.uuid,
					};
				},
			),
		};

		const getBlocks = (): readonly BlockModel[] | "all" =>
			uuids === "all" ? ("all" as const) : uuids.map((uuid) => SharedPlots.getBlockByUuid(plot, uuid));

		return ActionController.instance.execute(
			uuids === "all" ? "Plot cleared" : "Blocks removed",
			async () => {
				await Remotes.Client.GetNamespace("Building").Get("PlaceBlocks").CallServerAsync(undo);
			},
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("DeleteBlocks")
					.CallServerAsync({ plot, blocks: getBlocks() });
			},
		);
	},
	moveBlocks: (plot: PlotModel, _blocks: readonly BlockModel[], diff: Vector3) => {
		const uuids = _blocks.map((b) => BlockManager.getBlockDataByBlockModel(b).uuid);
		const getBlocks = (): readonly BlockModel[] => uuids.map((uuid) => SharedPlots.getBlockByUuid(plot, uuid));

		return ActionController.instance.execute(
			"Moving blocks",
			async () => {
				await Remotes.Client.GetNamespace("Building")
					.Get("MoveBlocks")
					.CallServerAsync({ plot, diff: diff.mul(-1), blocks: getBlocks() });
			},
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("MoveBlocks")
					.CallServerAsync({ plot, diff, blocks: getBlocks() });
			},
		);
	},
} as const;
