import { LoadingController } from "client/controller/LoadingController";
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
				const execute = () =>
					Remotes.Client.GetNamespace("Building")
						.Get("DeleteBlocks")
						.CallServerAsync({ plot: plot.instance, blocks: placed });

				if (blocks.size() > 10) {
					return LoadingController.runAsync("Deleting blocks", execute);
				}

				return execute();
			},
			() => {
				const execute = async () => {
					const response = await Remotes.Client.GetNamespace("Building")
						.Get("PlaceBlocks")
						.CallServerAsync({ plot: plot.instance, blocks });
					if (response.success) {
						placed = response.models;
					}

					return response;
				};

				if (blocks.size() > 10) {
					return LoadingController.runAsync("Placing blocks", execute);
				}
				return execute();
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
		const blockCount = uuids === "all" ? plot.getBlocks().size() : uuids.size();

		type SavedConnection = {
			readonly inputBlock: BlockUuid;
			readonly outputBlock: BlockUuid;
			readonly inputConnection: BlockConnectionName;
			readonly outputConnection: BlockConnectionName;
		};
		const connectedByLogic: SavedConnection[] = [];

		if (uuids !== "all") {
			const connections = SharedBuilding.getBlocksConnectedByLogicToMulti(plot.instance, new Set(uuids));

			for (const [blockUuid, c] of connections) {
				for (const [otherblock, connectionName, connection] of c) {
					connectedByLogic.push({
						inputBlock: otherblock.uuid,
						outputBlock: blockUuid,
						inputConnection: connectionName,
						outputConnection: connection.connectionName,
					});
				}
			}
		}

		const undo: PlaceBlocksRequest = {
			plot: plot.instance,
			blocks: (_blocks === "all" ? plot.getBlocks() : _blocks).map((block): PlaceBlockRequest => {
				const data = BlockManager.getBlockDataByBlockModel(block);

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
			() => {
				const execute = async (): Promise<Response> => {
					const response = await Remotes.Client.GetNamespace("Building")
						.Get("PlaceBlocks")
						.CallServerAsync(undo);
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
				};

				if (blockCount > 10) {
					return LoadingController.runAsync("Placing blocks", execute);
				}

				return execute();
			},
			() => {
				const execute = () =>
					Remotes.Client.GetNamespace("Building")
						.Get("DeleteBlocks")
						.CallServerAsync({ plot: plot.instance, blocks: getBlocks() });

				if (blockCount > 10) {
					return LoadingController.runAsync("Removing blocks", execute);
				}

				return execute();
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
			() =>
				LoadingController.runAsync("Moving blocks", async () => {
					return Remotes.Client.GetNamespace("Building")
						.Get("MoveBlocks")
						.CallServerAsync({ plot: plot.instance, diff: diff.mul(-1), blocks: getBlocks() });
				}),
			() =>
				LoadingController.runAsync("Moving blocks", async () => {
					return Remotes.Client.GetNamespace("Building")
						.Get("MoveBlocks")
						.CallServerAsync({ plot: plot.instance, diff, blocks: getBlocks() });
				}),
		);

		plot.changed.Fire();
		return result;
	},
	rotateBlocks: async (plot: SharedPlot, _blocks: readonly BlockModel[], pivot: Vector3, rotation: CFrame) => {
		const uuids = _blocks.map((b) => BlockManager.getBlockDataByBlockModel(b).uuid);
		const getBlocks = (): readonly BlockModel[] =>
			uuids.map((uuid) => SharedPlots.getBlockByUuid(plot.instance, uuid));

		const result = await ActionController.instance.execute(
			"Rotate blocks",
			() =>
				LoadingController.runAsync("Rotating blocks", async () => {
					return Remotes.Client.GetNamespace("Building")
						.Get("RotateBlocks")
						.CallServerAsync({ plot: plot.instance, pivot, diff: rotation.Inverse(), blocks: getBlocks() });
				}),
			() =>
				LoadingController.runAsync("Rotating blocks", async () => {
					return Remotes.Client.GetNamespace("Building")
						.Get("RotateBlocks")
						.CallServerAsync({ plot: plot.instance, pivot, diff: rotation, blocks: getBlocks() });
				}),
		);

		plot.changed.Fire();
		return result;
	},
} as const;
