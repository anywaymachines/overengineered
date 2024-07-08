import { LoadingController } from "client/controller/LoadingController";
import { ActionController } from "client/modes/build/ActionController";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Operation } from "shared/Operation";
import { CustomRemotes } from "shared/Remotes";
import type { SharedPlot } from "shared/building/SharedPlot";

const building = CustomRemotes.building;

/** Methods to send building requests to the server, with undo/redo support. No validation is performed. */
export namespace ClientBuilding {
	export const placeOperation = new Operation(placeBlocks);
	export const deleteOperation = new Operation(deleteBlocks);
	export const editOperation = new Operation(editBlocks);
	export const paintOperation = new Operation(paintBlocks);
	export const updateConfigOperation = new Operation(updateConfig);
	export const resetConfigOperation = new Operation(resetConfig);
	export const logicConnectOperation = new Operation(logicConnect);
	export const logicDisconnectOperation = new Operation(logicDisconnect);

	type PlaceBlocksArgs = {
		readonly plot: SharedPlot;
		readonly blocks: readonly Omit<PlaceBlockRequest, "uuid">[];
	};
	function placeBlocks({ plot, blocks }: PlaceBlocksArgs) {
		let placed: readonly BlockUuid[];
		const result = ActionController.instance.execute(
			"Place blocks",
			() => {
				const execute = () =>
					building.deleteBlocks.send({
						plot: plot.instance,
						blocks: placed.map((uuid) => plot.getBlock(uuid)),
					});

				if (blocks.size() > 10) {
					return LoadingController.run("Deleting blocks", execute);
				}

				return execute();
			},
			() => {
				const execute = () => {
					const response = building.placeBlocks.send({ plot: plot.instance, blocks });
					if (response.success) {
						placed = response.models.map(BlockManager.manager.uuid.get);
					}

					return response;
				};

				if (blocks.size() > 10) {
					return LoadingController.run("Placing blocks", execute);
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

	type DeleteBlocksArgs = {
		readonly plot: SharedPlot;
		readonly blocks: readonly BlockModel[] | "all";
	};
	function deleteBlocks({ plot, blocks: _blocks }: DeleteBlocksArgs) {
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
			const connections = SharedBuilding.getBlocksConnectedByLogicToMulti(plot.getBlockDatas(), new Set(uuids));

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
					...data,
					location: block.GetPivot(),
					["instance" as never]: undefined,
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

		const result = ActionController.instance.execute(
			uuids === "all" ? "Clear plot" : "Remove blocks",
			() => {
				const execute = (): Response => {
					const response = building.placeBlocks.send(undo);
					if (!response.success) {
						return response;
					}

					for (const connection of connectedByLogic) {
						const response = building.logicConnect.send(getConnectRequest(connection));

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
					return LoadingController.run("Placing blocks", execute);
				}

				return execute();
			},
			() => {
				const execute = () => building.deleteBlocks.send({ plot: plot.instance, blocks: getBlocks() });

				if (blockCount > 10) {
					return LoadingController.run("Removing blocks", execute);
				}

				return execute();
			},
		);

		plot.changed.Fire();
		return result;
	}

	type EditBlockInfoBase = {
		readonly origPosition: CFrame;
		readonly newPosition?: CFrame;
	};
	export type EditBlockInfo = EditBlockInfoBase & { readonly instance: BlockModel };
	type EditBlockRequestInfo = EditBlocksRequest["blocks"][number];
	type EditBlocksArgs = {
		readonly plot: SharedPlot;
		readonly blocks: readonly EditBlockInfo[];
	};
	function editBlocks({ plot, blocks: _blocks }: EditBlocksArgs) {
		const blocks = _blocks.map((b): EditBlockInfoBase & { readonly uuid: BlockUuid } => ({
			uuid: BlockManager.manager.uuid.get(b.instance),
			newPosition: b.newPosition,
			origPosition: b.origPosition,
		}));

		const getOrigBlocks = (): readonly EditBlockRequestInfo[] =>
			blocks.map(
				(b): EditBlockRequestInfo => ({
					instance: plot.getBlock(b.uuid),
					position: b.origPosition,
				}),
			);
		const getBlocks = (): readonly EditBlockRequestInfo[] =>
			blocks.map(
				(b): EditBlockRequestInfo => ({
					instance: plot.getBlock(b.uuid),
					position: b.newPosition,
				}),
			);

		const result = ActionController.instance.execute(
			"Edit blocks",
			() => {
				const execute = () => building.editBlocks.send({ plot: plot.instance, blocks: getOrigBlocks() });

				if (blocks.size() > 10) {
					return LoadingController.run("Editing blocks", execute);
				}
				return execute();
			},
			() => {
				const execute = () => building.editBlocks.send({ plot: plot.instance, blocks: getBlocks() });

				if (blocks.size() > 10) {
					return LoadingController.run("Editing blocks", execute);
				}
				return execute();
			},
		);

		plot.changed.Fire();
		return result;
	}

	type PaintBlocksArgs = {
		readonly plot: SharedPlot;
		readonly blocks: readonly BlockModel[] | "all";
		readonly material: Enum.Material | undefined;
		readonly color: Color3 | undefined;
		readonly original?: ReadonlyMap<BlockModel, { readonly material: Enum.Material; readonly color: Color3 }>;
	};
	function paintBlocks({ plot, blocks: _blocks, material, color, original: _original }: PaintBlocksArgs) {
		$trace("Executing painting operation", { plot, _blocks, material, color, _original });

		const origData = _original
			? new ReadonlyMap(_original.map((block, value) => [BlockManager.manager.uuid.get(block), value] as const))
			: new ReadonlyMap(
					(_blocks === "all" ? plot.getBlocks() : _blocks).map(
						(b) =>
							[
								BlockManager.manager.uuid.get(b),
								{
									material: BlockManager.manager.material.get(b),
									color: BlockManager.manager.color.get(b),
								},
							] as const,
					),
				);
		const getBlocks = (): readonly BlockModel[] => origData.map((uuid) => plot.getBlock(uuid));

		const result = ActionController.instance.execute(
			"Paint blocks",
			() => {
				const grouped = new Map<Enum.Material, Map<string, BlockUuid[]>>();
				for (const [uuid, { material, color }] of origData) {
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

						const result = building.paintBlocks.send({
							plot: plot.instance,
							material,
							color: Color3.fromHex(color),
							blocks,
						});

						if (!result.success) {
							return result;
						}
					}
				}

				return { success: true };
			},
			() =>
				building.paintBlocks.send({
					plot: plot.instance,
					material,
					color,
					blocks: getBlocks(),
				}),
		);

		plot.changed.Fire();
		return result;
	}

	type UpdateConfigArgs = {
		readonly plot: SharedPlot;
		readonly configs: ConfigUpdateRequest["configs"];
	};
	function updateConfig({ plot, configs }: UpdateConfigArgs) {
		return building.updateConfig.send({ plot: plot.instance, configs });
	}

	type ResetConfigArgs = {
		readonly plot: SharedPlot;
		readonly blocks: readonly BlockModel[];
	};
	function resetConfig({ plot, blocks: _blocks }: ResetConfigArgs) {
		return building.resetConfig.send({ plot: plot.instance, blocks: _blocks });
	}

	type LogicConnectArgs = {
		readonly plot: SharedPlot;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
		readonly outputBlock: BlockModel;
		readonly outputConnection: BlockConnectionName;
	};
	function logicConnect({
		plot,
		inputBlock: _inputBlock,
		inputConnection,
		outputBlock: _outputBlock,
		outputConnection,
	}: LogicConnectArgs) {
		const inputBlock = BlockManager.manager.uuid.get(_inputBlock);
		const outputBlock = BlockManager.manager.uuid.get(_outputBlock);

		return ActionController.instance.execute(
			"Connect logic",
			() => {
				return building.logicDisconnect.send({
					plot: plot.instance,
					inputBlock: plot.getBlock(inputBlock),
					inputConnection,
				});
			},
			() => {
				return building.logicConnect.send({
					plot: plot.instance,
					inputBlock: plot.getBlock(inputBlock),
					inputConnection,
					outputBlock: plot.getBlock(outputBlock),
					outputConnection,
				});
			},
		);
	}

	type LogicDisconnectArgs = {
		readonly plot: SharedPlot;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	};
	function logicDisconnect({ plot, inputBlock: _inputBlock, inputConnection }: LogicDisconnectArgs) {
		const inputBlock = BlockManager.manager.uuid.get(_inputBlock);
		const output = BlockManager.manager.connections.get(_inputBlock)![inputConnection];

		return ActionController.instance.execute(
			"Disconnect logic",
			() => {
				return building.logicConnect.send({
					plot: plot.instance,
					inputBlock: plot.getBlock(inputBlock),
					inputConnection,
					outputBlock: plot.getBlock(output.blockUuid),
					outputConnection: output.connectionName,
				});
			},
			() => {
				return building.logicDisconnect.send({
					plot: plot.instance,
					inputBlock: plot.getBlock(inputBlock),
					inputConnection,
				});
			},
		);
	}
}
