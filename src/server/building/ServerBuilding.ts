import { HttpService } from "@rbxts/services";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { BlockManager, PlacedBlockConfig, PlacedBlockLogicConnections } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { SharedPlots } from "shared/building/SharedPlots";
import { AABB } from "shared/fixes/AABB";
import { JSON, JsonSerializablePrimitive } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import { BuildingWelder } from "./BuildingWelder";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };

/** Bumps the {@link PlotModel} `version` attribute */
const bumpPlotVersion = (plot: PlotModel) => {
	const component = SharedPlots.getPlotComponent(plot);
	task.defer(() => component.version.set((component.version.get() ?? 0) + 1));
};

/** Methods for editing the buildings server-side */
export namespace ServerBuilding {
	export function clearPlot(plot: PlotModel): void {
		plot.Blocks.ClearAllChildren();
		BuildingWelder.deleteWelds(plot);

		bumpPlotVersion(plot);
	}
	export function placeBlock(plot: PlotModel, data: PlaceBlockRequest): BuildResponse {
		const plotc = SharedPlots.getPlotComponent(plot);
		if (plotc.ownerId.get() === undefined) {
			return { success: false, message: "Player quit." };
		}

		// validation removed as does not help with cloning
		/*if (
			SharedPlots.getPlotComponent(plot)
				.getBlocks()
				.any((b) => b.GetPivot().Position === data.location.Position)
		) {
			return { success: true, model: undefined };
		}*/

		const uuid = data.uuid ?? (HttpService.GenerateGUID(false) as BlockUuid);
		if (SharedPlots.tryGetBlockByUuid(plot, uuid)) {
			throw "Block with this uuid already exists";
		}

		const block = BlocksInitializer.blocks.map.get(data.id)!;

		// Create a new instance of the building model
		const model = block.model.Clone();
		BlockManager.manager.id.set(model, data.id);

		model.PivotTo(data.location);

		// Set material & color
		if (data.config && Objects.size(data.config) !== 0) {
			BlockManager.manager.config.set(model, data.config);
		}
		if (data.connections !== undefined && Objects.size(data.connections) !== 0) {
			BlockManager.manager.connections.set(model, data.connections);
		}

		BlockManager.manager.uuid.set(model, uuid);
		model.Name = uuid;

		SharedBuilding.paint([model], data.color, data.material, true);
		if (math.random(3) === 1) {
			task.wait();
		}

		if (plotc.ownerId.get() === undefined) {
			return { success: false, message: "Player quit." };
		}

		model.Parent = plot.Blocks;
		BuildingWelder.weldOnPlot(plot, model);

		bumpPlotVersion(plot);
		return { success: true, model: model };
	}
	export function deleteBlocks({ plot, blocks }: DeleteBlocksRequest): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		if (blocks === "all") {
			blocks = SharedPlots.getPlotComponent(plot).getBlocks();
			for (const block of blocks) {
				block.Destroy();
				if (math.random(6) === 1) {
					task.wait();
				}
			}

			BuildingWelder.deleteWelds(plot);
		} else {
			const connections = SharedBuilding.getBlocksConnectedByLogicToMulti(
				plot,
				blocks.mapToSet(BlockManager.manager.uuid.get),
			);
			for (const [, c] of connections) {
				for (const [otherblock, connectionName] of c) {
					logicDisconnect({
						plot,
						inputBlock: otherblock.instance,
						inputConnection: connectionName,
					});
				}
			}

			for (const block of blocks) {
				BuildingWelder.unweld(block);
				BuildingWelder.deleteWeld(plot, block);

				block.Destroy();
				if (math.random(3) === 1) {
					task.wait();
				}
			}
		}

		bumpPlotVersion(plot);
		return success;
	}
	export function moveBlocks({ plot, blocks, diff }: MoveBlocksRequest): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		let blocksRegion = blocks === "all" ? AABB.fromModel(plot.Blocks) : AABB.fromModels(blocks);
		blocksRegion = blocksRegion.withCenter(blocksRegion.getCenter().add(diff));

		blocks = blocks === "all" ? SharedPlots.getPlotComponent(plot).getBlocks() : blocks;
		if (!SharedPlots.getPlotBuildingRegion(plot).contains(blocksRegion)) {
			return err("Invalid movement");
		}

		for (const block of blocks) {
			block.PivotTo(block.GetPivot().add(diff));

			// TODO:: not unweld moved blocks between them
			BuildingWelder.moveCollisions(plot, block, block.GetPivot());

			if (math.random(3) === 1) {
				task.wait();
			}
		}

		bumpPlotVersion(plot);
		return success;
	}
	export function rotateBlocks({ plot, blocks, pivot, diff }: RotateBlocksRequest): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		const mul = (source: CFrame) => {
			const pvt = new CFrame(pivot);
			const loc = pvt.ToObjectSpace(source);
			return pvt.mul(diff).ToWorldSpace(loc);
		};

		let blocksRegion = blocks === "all" ? AABB.fromModel(plot.Blocks) : AABB.fromModels(blocks);
		blocksRegion = blocksRegion.withCenter(mul(new CFrame(blocksRegion.getCenter())));

		blocks = blocks === "all" ? SharedPlots.getPlotComponent(plot).getBlocks() : blocks;
		if (!SharedPlots.getPlotBuildingRegion(plot).contains(blocksRegion)) {
			return err("Invalid rotation");
		}

		for (const block of blocks) {
			block.PivotTo(mul(block.GetPivot()));

			// TODO:: not unweld moved blocks between them
			BuildingWelder.moveCollisions(plot, block, block.GetPivot());

			if (math.random(3) === 1) {
				task.wait();
			}
		}

		bumpPlotVersion(plot);
		return success;
	}
	export function logicConnect(request: LogicConnectRequest): Response {
		const inputInfo = BlockManager.manager.connections.get(request.inputBlock);
		const outputInfo = BlockManager.manager.uuid.get(request.outputBlock);

		const connections: PlacedBlockLogicConnections = {
			...inputInfo,
			[request.inputConnection]: {
				blockUuid: outputInfo,
				connectionName: request.outputConnection,
			},
		};

		BlockManager.manager.connections.set(request.inputBlock, connections);
		bumpPlotVersion(request.plot);
		return success;
	}
	export function logicDisconnect(request: LogicDisconnectRequest): Response {
		const connections = { ...BlockManager.manager.connections.get(request.inputBlock) };
		if (connections[request.inputConnection]) {
			delete connections[request.inputConnection];
		}

		BlockManager.manager.connections.set(request.inputBlock, connections);
		bumpPlotVersion(request.plot);
		return success;
	}
	export function paintBlocks({ plot, blocks, color, material }: PaintBlocksRequest): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		blocks = blocks === "all" ? plot.Blocks.GetChildren(undefined) : blocks;
		SharedBuilding.paint(blocks, color, material, false);
		bumpPlotVersion(plot);
		return success;
	}
	export function updateConfig(request: ConfigUpdateRequest): Response {
		/**
		 * Assign only values, recursively.
		 * @example assignValues({ a: { b: 'foo' } }, 'a', { c: 'bar' })
		 * // returns:
		 * { a: { b: 'foo', c: 'bar' } }
		 */
		const withValues = <T extends Record<string, JsonSerializablePrimitive | object>>(
			object: T,
			value: Partial<T>,
		): object => {
			const setobj = <T extends Record<string, JsonSerializablePrimitive | object>, TKey extends keyof T>(
				object: T,
				key: TKey,
				value: T[TKey],
			) => {
				if (!typeIs(value, "table")) {
					return { ...object, [key]: value };
				}

				return withValues(object, value);
			};

			const ret: Record<string, JsonSerializablePrimitive | object> = { ...object };
			for (const [key, val] of pairs(value as Record<string, JsonSerializablePrimitive | object>)) {
				const rk = ret[key];

				if (typeIs(rk, "Vector3") || !typeIs(rk, "table")) {
					ret[key] = val;
				} else {
					ret[key] = setobj(rk as Record<string, JsonSerializablePrimitive | object>, key, val);
				}
			}

			return ret;
		};

		for (const config of request.configs) {
			const currentData = BlockManager.manager.config.get(config.block);
			const newData = withValues(currentData, { [config.key]: JSON.deserialize(config.value) });

			BlockManager.manager.config.set(config.block, newData as PlacedBlockConfig);
		}

		bumpPlotVersion(request.plot);
		return success;
	}
	export function resetConfig({ plot, blocks }: ConfigResetRequest): Response {
		for (const block of blocks) {
			BlockManager.manager.config.set(block, undefined);
		}

		bumpPlotVersion(plot);
		return success;
	}
}
