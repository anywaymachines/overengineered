import { ServerBuilding } from "server/building/ServerBuilding";
import { PlayersController } from "server/player/PlayersController";
import { ServerPlots } from "server/plots/ServerPlots";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { Controller } from "shared/component/Controller";
import { Operation } from "shared/Operation";
import type { ServerPlotController } from "server/plots/ServerPlots";

const err = (message: string): ErrorResponse => ({ success: false, message });
const errBuildingNotPermitted = err("Building is not permitted");
const errDestroyed = PlayersController.errDestroyed;

export class ServerBuildingRequestHandler2 extends Controller {
	readonly placeBlocksOperation = new Operation(this.placeBlocksReq.bind(this));

	private readonly player;

	constructor(player: Player) {
		super();
		this.player = player;
	}

	private placeBlocksReq(request: PlaceBlocksRequest): MultiBuildResponse {
		if (!SharedPlots.isBuildingAllowed(request.plot, this.player)) {
			return errBuildingNotPermitted;
		}

		const controller = ServerPlots.tryGetController(request.plot);
		if (!controller) {
			return errDestroyed;
		}

		return this.placeBlocks(controller, request.blocks);
	}
	private placeBlocks(plotc: ServerPlotController, blocks: readonly PlaceBlockRequest[]): MultiBuildResponse {
		if (this.isDestroyed()) return errDestroyed;

		for (const block of blocks) {
			if (
				!BuildingManager.serverBlockCanBePlacedAt(
					plotc.plot,
					BlockRegistry.map.get(block.id)!,
					block.location,
					this.player,
				)
			) {
				return err("Can't be placed here");
			}

			// if block with the same uuid already exists
			if (block.uuid !== undefined && plotc.plot.tryGetBlock(block.uuid)) {
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
			const regblock = BlockRegistry.map.get(id)!;
			const placed = plotc.plot
				.getBlocks()
				.count((placed_block) => BlockManager.manager.id.get(placed_block) === id);

			if (placed + count > (regblock.limit ?? 2000)) {
				return err(`Type limit exceeded for ${id}`);
			}
		}

		const placed: BlockModel[] = [];
		for (const block of blocks) {
			if (this.isDestroyed()) {
				for (const block of placed) {
					block.Destroy();
				}

				return errDestroyed;
			}

			const placedBlock = ServerBuilding.placeBlock(plotc.plot.instance, block);
			if (!placedBlock.success) {
				return placedBlock;
			}

			if (placedBlock.model) {
				placed.push(placedBlock.model);
			}
		}

		return {
			success: true,
			models: placed,
		};
	}

	private deleteBlocks(player: Player, request: DeleteBlocksRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}

		if (request.blocks !== "all") {
			for (const block of request.blocks) {
				if (!SharedPlots.isBlockOnAllowedPlot(player, block)) {
					return errBuildingNotPermitted;
				}
			}
		}

		if (this.isDestroyed()) return errDestroyed;
		return ServerBuilding.deleteBlocks(request);
	}
}
