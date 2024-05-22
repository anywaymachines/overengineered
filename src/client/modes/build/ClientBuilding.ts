import { LoadingController } from "client/controller/LoadingController";
import { ActionController } from "client/modes/build/ActionController";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Operation } from "shared/Operation";
import { Remotes } from "shared/Remotes";
import type { SharedPlot } from "shared/building/SharedPlot";

/** Methods to send building requests to the server, with undo/redo support. No validation is performed. */
export namespace ClientBuilding {
	export const placeOperation = new Operation(placeBlocks);
	export const deleteOperation = new Operation(deleteBlocks);
	export const moveOperation = new Operation(moveBlocks);
	export const rotateOperation = new Operation(rotateBlocks);
	export const paintOperation = new Operation(paintBlocks);
	export const updateConfigOperation = new Operation(updateConfig);
	export const resetConfigOperation = new Operation(resetConfig);
	export const logicConnectOperation = new Operation(logicConnect);
	export const logicDisconnectOperation = new Operation(logicDisconnect);

	async function placeBlocks(plot: SharedPlot, blocks: readonly Omit<PlaceBlockRequest, "uuid">[]) {
		let placed: readonly BlockUuid[];
		const result = await ActionController.instance.execute(
			"Place blocks",
			() => {
				const execute = () =>
					Remotes.Client.GetNamespace("Building")
						.Get("DeleteBlocks")
						.CallServerAsync({ plot: plot.instance, blocks: placed.map((uuid) => plot.getBlock(uuid)) });

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
						placed = response.models.map(BlockManager.manager.uuid.get);
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
	}
	async function deleteBlocks(plot: SharedPlot, _blocks: readonly BlockModel[] | "all") {
		const uuids = _blocks === "all" ? "all" : _blocks.map(BlockManager.manager.uuid.get);
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
			uuids === "all" ? ("all" as const) : uuids.map((uuid) => plot.getBlock(uuid));
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
	}
	async function moveBlocks(plot: SharedPlot, _blocks: readonly BlockModel[], diff: Vector3) {
		const uuids = _blocks.map(BlockManager.manager.uuid.get);
		const getBlocks = (): readonly BlockModel[] => uuids.map((uuid) => plot.getBlock(uuid));

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
	}
	async function rotateBlocks(plot: SharedPlot, _blocks: readonly BlockModel[], pivot: Vector3, rotation: CFrame) {
		const uuids = _blocks.map(BlockManager.manager.uuid.get);
		const getBlocks = (): readonly BlockModel[] => uuids.map((uuid) => plot.getBlock(uuid));

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
	}
	async function paintBlocks(
		plot: SharedPlot,
		_blocks: readonly BlockModel[] | "all",
		material: Enum.Material | undefined,
		color: Color3 | undefined,
		_original?: ReadonlyMap<BlockModel, readonly [material: Enum.Material, color: Color3]>,
	) {
		const origData = _original
			? new ReadonlyMap(_original.map((block, value) => [BlockManager.manager.uuid.get(block), value] as const))
			: new ReadonlyMap(
					(_blocks === "all" ? plot.getBlocks() : _blocks).map(
						(b) =>
							[
								BlockManager.manager.uuid.get(b),
								[BlockManager.manager.material.get(b), BlockManager.manager.color.get(b)],
							] as const,
					),
				);
		const getBlocks = (): readonly BlockModel[] => origData.map((uuid) => plot.getBlock(uuid));

		const result = await ActionController.instance.execute(
			"Paint blocks",
			async () => {
				const grouped = new Map<Enum.Material, Map<string, BlockUuid[]>>();
				for (const [uuid, [material, color]] of origData) {
					let matmap = grouped.get(material);
					if (!matmap) {
						matmap = new Map();
						grouped.set(material, matmap);
					}

					let colormap = matmap.get(color.ToHex());
					if (!colormap) {
						colormap = [];
						matmap.set(color.ToHex(), colormap);
					}

					colormap.push(uuid);
				}

				for (const [material, colorgroup] of grouped) {
					for (const [color, uuids] of colorgroup) {
						const blocks = uuids.map((uuid) => plot.getBlock(uuid));

						const result = await LoadingController.runAsync("Painting blocks", async () => {
							return Remotes.Client.GetNamespace("Building")
								.Get("PaintBlocks")
								.CallServerAsync({
									plot: plot.instance,
									material,
									color: Color3.fromHex(color),
									blocks,
								});
						});

						if (!result.success) {
							return result;
						}
					}
				}

				return { success: true };
			},
			() =>
				LoadingController.runAsync("Painting blocks", async () => {
					return Remotes.Client.GetNamespace("Building")
						.Get("PaintBlocks")
						.CallServerAsync({ plot: plot.instance, material, color, blocks: getBlocks() });
				}),
		);

		plot.changed.Fire();
		return result;
	}
	async function updateConfig(plot: SharedPlot, configs: ConfigUpdateRequest["configs"]) {
		return await Remotes.Client.GetNamespace("Building")
			.Get("UpdateConfigRequest")
			.CallServerAsync({ plot: plot.instance, configs });
	}
	async function resetConfig(plot: SharedPlot, _blocks: readonly BlockModel[]) {
		return await Remotes.Client.GetNamespace("Building")
			.Get("ResetConfigRequest")
			.CallServerAsync({ plot: plot.instance, blocks: _blocks });
	}

	async function logicConnect(
		plot: SharedPlot,
		_inputBlock: BlockModel,
		inputConnection: BlockConnectionName,
		_outputBlock: BlockModel,
		outputConnection: BlockConnectionName,
	) {
		const inputBlock = BlockManager.manager.uuid.get(_inputBlock);
		const outputBlock = BlockManager.manager.uuid.get(_outputBlock);

		return await ActionController.instance.execute(
			"Connect logic",
			async () => {
				return await Remotes.Client.GetNamespace("Building")
					.Get("LogicDisconnect")
					.CallServerAsync({
						plot: plot.instance,
						inputBlock: plot.getBlock(inputBlock),
						inputConnection,
					});
			},
			async () => {
				return await Remotes.Client.GetNamespace("Building")
					.Get("LogicConnect")
					.CallServerAsync({
						plot: plot.instance,
						inputBlock: plot.getBlock(inputBlock),
						inputConnection,
						outputBlock: plot.getBlock(outputBlock),
						outputConnection,
					});
			},
		);
	}
	async function logicDisconnect(plot: SharedPlot, _inputBlock: BlockModel, inputConnection: BlockConnectionName) {
		const inputBlock = BlockManager.manager.uuid.get(_inputBlock);
		const output = BlockManager.manager.connections.get(_inputBlock)[inputConnection];

		return await ActionController.instance.execute(
			"Disconnect logic",
			async () => {
				return await Remotes.Client.GetNamespace("Building")
					.Get("LogicConnect")
					.CallServerAsync({
						plot: plot.instance,
						inputBlock: plot.getBlock(inputBlock),
						inputConnection,
						outputBlock: plot.getBlock(output.blockUuid),
						outputConnection: output.connectionName,
					});
			},
			async () => {
				return await Remotes.Client.GetNamespace("Building")
					.Get("LogicDisconnect")
					.CallServerAsync({
						plot: plot.instance,
						inputBlock: plot.getBlock(inputBlock),
						inputConnection,
					});
			},
		);
	}
}
