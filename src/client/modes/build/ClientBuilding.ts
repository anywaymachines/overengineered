import ActionController from "client/modes/build/ActionController";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { SharedPlot } from "shared/building/SharedPlot";
import SharedPlots from "shared/building/SharedPlots";

/** Methods to send building requests to the server, with undo/redo support. No validation is performed. */
export const ClientBuilding = {
	placeBlocks: async (plot: SharedPlot, blocks: readonly Omit<PlaceBlockRequest, "uuid">[]) => {
		let placed: readonly BlockModel[];
		const result = await ActionController.instance.execute(
			"Place blocks",
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("DeleteBlocks")
					.CallServerAsync({ plot: plot.instance, blocks: placed });
			},
			async () => {
				const response = await Remotes.Client.GetNamespace("Building")
					.Get("PlaceBlocks")
					.CallServerAsync({ plot: plot.instance, blocks });
				if (response.success) {
					placed = response.models;
				}

				return response;
			},
		);

		if (result.success) {
			for (const model of result.models) {
				while (!model.PrimaryPart) {
					task.wait();
				}
			}
		}

		task.wait();
		plot.changed.Fire();
		return result;
	},
	deleteBlocks: async (plot: SharedPlot, _blocks: readonly BlockModel[] | "all") => {
		const uuids = _blocks === "all" ? "all" : _blocks.map((b) => BlockManager.getBlockDataByBlockModel(b).uuid);

		type SavedConnection = {
			readonly inputBlock: BlockUuid;
			readonly outputBlock: BlockUuid;
			readonly inputConnection: BlockConnectionName;
			readonly outputConnection: BlockConnectionName;
		};
		const connectedByLogic: SavedConnection[] = [];

		const undo: PlaceBlocksRequest = {
			plot: plot.instance,
			blocks: (_blocks === "all" ? plot.getBlocks() : _blocks).map((block): PlaceBlockRequest => {
				const data = BlockManager.getBlockDataByBlockModel(block);

				if (uuids !== "all") {
					for (const [otherblock, connectionName, connection] of SharedBuilding.getBlocksConnectedByLogicTo(
						plot.instance,
						data.uuid,
					)) {
						connectedByLogic.push({
							inputBlock: otherblock.uuid,
							outputBlock: data.uuid,
							inputConnection: connectionName,
							outputConnection: connection.connectionName,
						});
					}
				}

				return {
					id: data.id,
					location: block.GetPivot(),
					color: data.color,
					material: data.material,
					uuid: data.uuid,
					config: data.config,
					connections: data.connections,
				};
			}),
		};

		const getBlocks = (): readonly BlockModel[] | "all" =>
			uuids === "all" ? ("all" as const) : uuids.map((uuid) => SharedPlots.getBlockByUuid(plot.instance, uuid));
		const getConnectRequest = (connection: SavedConnection): LogicConnectRequest => {
			return {
				plot: plot.instance,
				inputBlock: plot.getBlock(connection.inputBlock),
				inputConnection: connection.inputConnection,
				outputBlock: plot.getBlock(connection.outputBlock),
				outputConnection: connection.outputConnection,
			};
		};

		const result = await ActionController.instance.execute(
			uuids === "all" ? "Clear plot" : "Remove blocks",
			async () => {
				const response = await Remotes.Client.GetNamespace("Building").Get("PlaceBlocks").CallServerAsync(undo);
				if (!response.success) {
					return response;
				}

				for (const connection of connectedByLogic) {
					const response = await Remotes.Client.GetNamespace("Building")
						.Get("LogicConnect")
						.CallServerAsync(getConnectRequest(connection));

					if (!response.success) {
						return response;
					}
				}

				for (const model of response.models) {
					while (!model.PrimaryPart) {
						task.wait();
					}
				}

				return { success: true };
			},
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("DeleteBlocks")
					.CallServerAsync({ plot: plot.instance, blocks: getBlocks() });
			},
		);

		plot.changed.Fire();
		return result;
	},
	moveBlocks: async (plot: SharedPlot, _blocks: readonly BlockModel[], diff: Vector3) => {
		const uuids = _blocks.map((b) => BlockManager.getBlockDataByBlockModel(b).uuid);
		const getBlocks = (): readonly BlockModel[] =>
			uuids.map((uuid) => SharedPlots.getBlockByUuid(plot.instance, uuid));

		const result = await ActionController.instance.execute(
			"Move blocks",
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("MoveBlocks")
					.CallServerAsync({ plot: plot.instance, diff: diff.mul(-1), blocks: getBlocks() });
			},
			() => {
				return Remotes.Client.GetNamespace("Building")
					.Get("MoveBlocks")
					.CallServerAsync({ plot: plot.instance, diff, blocks: getBlocks() });
			},
		);

		plot.changed.Fire();
		return result;
	},
} as const;
