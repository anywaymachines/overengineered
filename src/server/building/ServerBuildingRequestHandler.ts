import { BlocksInitializer } from "shared/BlocksInitializer";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { ServerBuilding } from "./ServerBuilding";

const err = (message: string): ErrorResponse => ({ success: false, message });
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for editing the buildings server-side on player requests */
export namespace ServerBuildingRequestHandler {
	export function placeBlocks(player: Player, request: PlaceBlocksRequest): MultiBuildResponse {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}

		for (const block of request.blocks) {
			if (
				!BuildingManager.serverBlockCanBePlacedAt(
					SharedPlots.getPlotComponent(request.plot),
					BlocksInitializer.blocks.map.get(block.id)!,
					block.location,
					player,
				)
			) {
				return err("Can't be placed here");
			}

			// if block with the same uuid already exists
			if (block.uuid !== undefined && SharedPlots.tryGetBlockByUuid(request.plot, block.uuid)) {
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

		const counts = countBy(request.blocks, (b) => b.id);
		for (const [id, count] of counts) {
			const regblock = BlocksInitializer.blocks.map.get(id)!;
			const placed = SharedPlots.getPlotComponent(request.plot)
				.getBlocks()
				.count((placed_block) => {
					return BlockManager.manager.id.get(placed_block) === id;
				});

			if (placed + count > (regblock.limit ?? 2000)) {
				return err(`Type limit exceeded for ${id}`);
			}
		}

		const placed: BlockModel[] = [];
		for (const block of request.blocks) {
			const placedBlock = ServerBuilding.placeBlock(request.plot, block);
			if (!placedBlock.success) {
				return placedBlock;
			}

			placed.push(placedBlock.model);
		}

		return {
			success: true,
			models: placed,
		};
	}
	export function deleteBlocks(player: Player, request: DeleteBlocksRequest): Response {
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

		return ServerBuilding.deleteBlocks(request);
	}
	export function moveBlocks(player: Player, request: MoveBlocksRequest): Response {
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

		return ServerBuilding.moveBlocks(request);
	}
	export function rotateBlocks(player: Player, request: RotateBlocksRequest): Response {
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

		return ServerBuilding.rotateBlocks(request);
	}
	export function logicConnect(player: Player, request: LogicConnectRequest): Response {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.outputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicConnect(request);
	}
	export function logicDisconnect(player: Player, request: LogicDisconnectRequest): Response {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicDisconnect(request);
	}
	export function paintBlocks(player: Player, request: PaintBlocksRequest): Response {
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

		return ServerBuilding.paintBlocks(request);
	}
	export function updateConfig(player: Player, request: ConfigUpdateRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const config of request.configs) {
			if (!SharedPlots.isBlockOnAllowedPlot(player, config.block)) {
				return errBuildingNotPermitted;
			}
		}

		return ServerBuilding.updateConfig(request);
	}
	export function resetConfig(player: Player, request: ConfigResetRequest): Response {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const block of request.blocks) {
			if (!SharedPlots.isBlockOnAllowedPlot(player, block)) {
				return errBuildingNotPermitted;
			}
		}

		return ServerBuilding.resetConfig(request);
	}
}
