import { Backend } from "server/Backend";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayerWatcher } from "server/PlayerWatcher";
import { BlocksSerializer } from "server/plots/BlocksSerializer";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
import { Operation } from "shared/Operation";
import { SlotsMeta } from "shared/SlotsMeta";
import type { ServerPlotController, ServerPlots } from "server/plots/ServerPlots";
import type { BlockRegistry } from "shared/block/BlockRegistry";

const err = (message: string): ErrorResponse => ({ success: false, message });
const errBuildingNotPermitted = err("Building is not permitted");
const errDestroyed = PlayerWatcher.errDestroyed;

const isBlockOnPlot = (block: BlockModel, plot: PlotModel): boolean => block.IsDescendantOf(plot);
const areAllBlocksOnPlot = (blocks: readonly BlockModel[], plot: PlotModel): boolean => {
	for (const block of blocks) {
		if (!isBlockOnPlot(block, plot)) {
			return false;
		}
	}

	return true;
};

/** Receiver for player build requests */
@injectable
export class ServerBuildingRequestHandler extends HostedService {
	readonly operations = {
		placeBlocks: new Operation(this.placeBlocks.bind(this)),
		deleteBlocks: new Operation(this.deleteBlocks.bind(this)),
		moveBlocks: new Operation(this.moveBlocks.bind(this)),
		rotateBlocks: new Operation(this.rotateBlocks.bind(this)),
		logicConnect: new Operation(this.logicConnect.bind(this)),
		logicDisconnect: new Operation(this.logicDisconnect.bind(this)),
		paintBlocks: new Operation(this.paintBlocks.bind(this)),
		updateConfig: new Operation(this.updateConfig.bind(this)),
		resetConfig: new Operation(this.resetConfig.bind(this)),
		saveSlot: new Operation(this.saveSlot.bind(this)),
		loadSlot: new Operation(this.loadSlot.bind(this)),
		loadImportedSlot: new Operation(this.loadImportedSlot.bind(this)),
		loadSlotAsAdmin: new Operation(this.loadSlotAsAdmin.bind(this)),
	} as const;

	readonly player: Player;

	constructor(
		@inject readonly controller: ServerPlotController,
		@inject private readonly serverPlots: ServerPlots,
		@inject private readonly blockRegistry: BlockRegistry,
	) {
		super();
		print("creating reqh", controller.player.Name);
		this.player = controller.player;
	}

	private placeBlocks(request: PlaceBlocksRequest): MultiBuildResponse {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}

		return this._placeBlocks(this.controller, request.blocks);
	}
	private _placeBlocks(plotc: ServerPlotController, blocks: readonly PlaceBlockRequest[]): MultiBuildResponse {
		for (const block of blocks) {
			if (
				!BuildingManager.serverBlockCanBePlacedAt(
					plotc.plot,
					this.blockRegistry.blocks.get(block.id)!,
					block.location,
					this.player,
				)
			) {
				return err("Can't be placed here");
			}

			// if block with the same uuid already exists
			if (block.uuid !== undefined && plotc.blocks.tryGetBlock(block.uuid)) {
				return err("Invalid block placement data");
			}
		}

		const countBy = <T, K>(arr: readonly T[], keyfunc: (value: T) => K): Map<K, number> => {
			const result = new Map<K, number>();
			for (const value of arr) {
				const key = keyfunc(value);
				result.set(key, (result.get(key) ?? 0) + 1);
			}

			return result;
		};

		const counts = countBy(blocks, (b) => b.id);
		for (const [id, count] of counts) {
			const regblock = this.blockRegistry.blocks.get(id)!;
			const placed = plotc.blocks
				.getBlocks()
				.count((placed_block) => BlockManager.manager.id.get(placed_block) === id);

			if (placed + count > (regblock.limit ?? 2000)) {
				return err(`Type limit exceeded for ${id}`);
			}
		}

		const placed: BlockModel[] = [];
		for (const block of blocks) {
			const placedBlock = plotc.blocks.place(block);
			if (!placedBlock.success) {
				return placedBlock;
			}

			if (placedBlock.model) {
				placed.push(placedBlock.model);
			}
		}

		return { success: true, models: placed };
	}

	private deleteBlocks(request: DeleteBlocksRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.delete(request.blocks);
	}
	private moveBlocks(request: MoveBlocksRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.move(request.blocks, request.diff);
	}
	private rotateBlocks(request: RotateBlocksRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.rotate(request.blocks, request.pivot, request.diff);
	}

	private logicConnect(request: LogicConnectRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.inputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.outputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.logicConnect(request);
	}
	private logicDisconnect(request: LogicDisconnectRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.inputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.logicDisconnect(request);
	}
	private paintBlocks(request: PaintBlocksRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.paintBlocks(request);
	}
	private updateConfig(request: ConfigUpdateRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		for (const config of request.configs) {
			if (!isBlockOnPlot(config.block, request.plot)) {
				return errBuildingNotPermitted;
			}
		}

		return this.controller.blocks.updateConfig(request.configs);
	}
	private resetConfig(request: ConfigResetRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}
		if (!areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.controller.blocks.resetConfig(request.blocks);
	}

	private saveSlot(request: PlayerSaveSlotRequest): SaveSlotResponse {
		const player = this.player;
		$log(`Saving ${player.Name}'s slot ${request.index}`);

		let output: ResponseExtract<SaveSlotResponse> | undefined;
		if (request.save) {
			const controller = this.serverPlots.tryGetControllerByPlayer(player);
			if (!controller) throw "what";

			output = SlotDatabase.instance.save(player.UserId, request.index, controller.blocks);
		}

		SlotDatabase.instance.updateMeta(player.UserId, request.index, (meta) => {
			const get = SlotsMeta.get(meta, request.index);
			return SlotsMeta.withSlot(meta, request.index, {
				name: request.name ?? get.name,
				color: request.color ?? get.color,
				touchControls: request.touchControls ?? get.touchControls,
			});
		});

		return {
			success: true,
			blocks: output?.blocks,
			size: output?.size,
		};
	}

	private loadSlot(index: number): LoadSlotResponse {
		return this.forceLoadSlot(this.player.UserId, index, false);
	}
	private loadImportedSlot(index: number): LoadSlotResponse {
		return this.forceLoadSlot(this.player.UserId, index, true);
	}
	private loadSlotAsAdmin(userid: number, index: number): LoadSlotResponse {
		if (!GameDefinitions.isAdmin(this.player)) {
			return err("Permission denied");
		}

		return this.forceLoadSlot(userid, index, true);
	}

	private forceLoadSlot(userid: number, index: number, imported: boolean): LoadSlotResponse {
		const start = os.clock();
		let blocks: string | undefined;

		if (imported) {
			const universeId = GameDefinitions.isTestPlace()
				? GameDefinitions.PRODUCTION_UNIVERSE_ID
				: GameDefinitions.INTERNAL_UNIVERSE_ID;
			blocks = Backend.Datastores.GetEntry(universeId, "slots", `${userid}_${index}`) as string | undefined;
		} else {
			blocks = SlotDatabase.instance.getBlocks(userid, index);
		}

		this.controller.blocks.delete("all");
		if (blocks === undefined || blocks.size() === 0) {
			return { success: true, isEmpty: true };
		}

		$log(`Loading ${userid}'s slot ${index}`);
		const dblocks = BlocksSerializer.deserialize(blocks, this.controller.blocks);
		$log(`Loaded ${userid} slot ${index} in ${os.clock() - start}`);

		return { success: true, isEmpty: dblocks === 0 };
	}
}
