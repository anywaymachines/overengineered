import { HttpService } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { AABB } from "shared/fixes/AABB";
import { JSON } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import type { BuildingWelder } from "server/building/BuildingWelder";
import type { BlockRegistryC } from "shared/block/BlockRegistry";
import type { PlacedBlockData, PlacedBlockLogicConnections } from "shared/building/BlockManager";
import type { SharedPlot } from "shared/building/SharedPlot";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };

/** Building on a plot. */
@injectable
export class BuildingPlot extends Component {
	private readonly localAABB: AABB;

	constructor(
		private readonly instance: Instance,
		/** @deprecated TOBEREMOVED */
		private readonly plot: SharedPlot,
		readonly center: CFrame,
		readonly size: Vector3,
		@inject private readonly blockRegistry: BlockRegistryC,
		@inject private readonly buildingWelder: BuildingWelder,
	) {
		super();
		ComponentInstance.init(this, instance);
		this.localAABB = AABB.fromCenterSize(Vector3.zero, size);

		this.onDestroy(() => buildingWelder.deleteWelds(this));
	}

	isInside(block: BlockModel): boolean {
		const [pos, size] = block.GetBoundingBox();
		const localPos = this.center.ToObjectSpace(pos);

		return this.localAABB.contains(AABB.fromCenterSize(localPos.Position, size).withCenter(localPos));
	}

	getBlockDatas(): readonly PlacedBlockData[] {
		return this.getBlocks().map(BlockManager.getBlockDataByBlockModel);
	}
	getBlocks(): readonly BlockModel[] {
		return this.instance.GetChildren() as unknown as readonly BlockModel[];
	}
	getBlock(uuid: BlockUuid): BlockModel {
		return (this.instance as unknown as Record<BlockUuid, BlockModel>)[uuid];
	}
	tryGetBlock(uuid: BlockUuid): BlockModel | undefined {
		return this.instance.FindFirstChild(uuid) as BlockModel | undefined;
	}

	clearBlocks(): void {
		this.instance.ClearAllChildren();
		this.buildingWelder.deleteWelds(this);
	}

	/** @deprecated Used only for a specific case, do not use & do not remove */
	justPlaceExisting(block: BlockModel): void {
		block.Parent = this.instance;
	}
	place(data: PlaceBlockRequest): BuildResponse {
		const uuid = data.uuid ?? (HttpService.GenerateGUID(false) as BlockUuid);
		if (this.tryGetBlock(uuid)) {
			throw "Block with this uuid already exists";
		}

		const block = this.blockRegistry.blocks.get(data.id);
		if (!block) {
			return { success: false, message: `Unknown block id ${data.id}` };
		}

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

		model.Parent = this.instance;
		this.buildingWelder.weldOnPlot(this, model);

		return { success: true, model: model };
	}
	delete(blocks: readonly BlockModel[] | "all"): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		if (blocks === "all") {
			blocks = this.getBlocks();
			for (const block of blocks) {
				block.Destroy();
				if (math.random(6) === 1) {
					task.wait();
				}
			}

			this.buildingWelder.deleteWelds(this);
		} else {
			const connections = SharedBuilding.getBlocksConnectedByLogicToMulti(
				this.getBlockDatas(),
				blocks.mapToSet(BlockManager.manager.uuid.get),
			);
			for (const [, c] of connections) {
				for (const [otherblock, connectionName] of c) {
					this.logicDisconnect({
						inputBlock: otherblock.instance,
						inputConnection: connectionName,
					});
				}
			}

			for (const block of blocks) {
				this.buildingWelder.unweld(block);
				this.buildingWelder.deleteWeld(this, block);

				block.Destroy();
				if (math.random(3) === 1) {
					task.wait();
				}
			}
		}

		return success;
	}
	move(blocks: readonly BlockModel[] | "all", diff: Vector3): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		blocks = blocks === "all" ? this.getBlocks() : blocks;
		let blocksRegion = AABB.fromModels(blocks);
		blocksRegion = blocksRegion.withCenter(blocksRegion.getCenter().add(diff));

		if (!this.plot.isInside(blocksRegion)) {
			return err("Invalid movement");
		}

		for (const block of blocks) {
			block.PivotTo(block.GetPivot().add(diff));
			this.buildingWelder.moveCollisions(this, block, block.GetPivot());

			if (math.random(3) === 1) {
				task.wait();
			}
		}

		return success;
	}
	rotate(blocks: readonly BlockModel[] | "all", pivot: Vector3, diff: CFrame): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		const mul = (source: CFrame) => {
			const pvt = new CFrame(pivot);
			const loc = pvt.ToObjectSpace(source);
			return pvt.mul(diff).ToWorldSpace(loc);
		};

		blocks = blocks === "all" ? this.getBlocks() : blocks;
		let blocksRegion = AABB.fromModels(blocks);
		blocksRegion = blocksRegion.withCenter(mul(new CFrame(blocksRegion.getCenter())));

		if (!this.plot.isInside(blocksRegion)) {
			return err("Invalid rotation");
		}

		for (const block of blocks) {
			block.PivotTo(mul(block.GetPivot()));

			// TODO:: not unweld moved blocks between them
			this.buildingWelder.moveCollisions(this, block, block.GetPivot());

			if (math.random(3) === 1) {
				task.wait();
			}
		}

		return success;
	}

	logicConnect(request: Omit<LogicConnectRequest, "plot">): Response {
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
		return success;
	}
	logicDisconnect({ inputBlock, inputConnection }: Omit<LogicDisconnectRequest, "plot">): Response {
		const connections = { ...BlockManager.manager.connections.get(inputBlock) };
		if (connections[inputConnection]) {
			delete connections[inputConnection];
		}

		BlockManager.manager.connections.set(inputBlock, connections);
		return success;
	}
	paintBlocks({ blocks, color, material }: Omit<PaintBlocksRequest, "plot">): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		blocks = blocks === "all" ? this.getBlocks() : blocks;
		SharedBuilding.paint(blocks, color, material, false);
		return success;
	}
	updateConfig(configs: ConfigUpdateRequest["configs"]): Response {
		/**
		 * Assign only values, recursively.
		 * @example assignValues({ a: { b: 'foo' } }, 'a', { c: 'bar' })
		 * // returns:
		 * { a: { b: 'foo', c: 'bar' } }
		 */
		const withValues = <T extends Record<string, unknown>>(object: T, value: Partial<T>): T => {
			const setobj = <T extends Record<string, unknown>, TKey extends keyof T>(
				object: T,
				key: TKey,
				value: T[TKey],
			) => {
				if (!typeIs(value, "table")) {
					return { ...object, [key]: value };
				}

				return withValues(object, value);
			};

			const ret: Record<string, unknown> = { ...object };
			for (const [key, val] of pairs(value as Record<string, object>)) {
				const rk = ret[key];

				if (typeIs(rk, "Vector3") || !typeIs(rk, "table")) {
					ret[key] = val;
				} else {
					ret[key] = setobj(rk as Record<string, object>, key, val);
				}
			}

			return ret as T;
		};

		for (const config of configs) {
			const currentData = BlockManager.manager.config.get(config.block);
			const newData = withValues(currentData, { [config.key]: JSON.deserialize(config.value) });

			BlockManager.manager.config.set(config.block, newData);
		}

		return success;
	}
	resetConfig(blocks: readonly BlockModel[]): Response {
		for (const block of blocks) {
			BlockManager.manager.config.set(block, undefined);
		}

		return success;
	}
}
