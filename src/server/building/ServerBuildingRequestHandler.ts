import { blockRegistry } from "shared/Registry";
import BlockManager from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";
import { ServerBuilding } from "./ServerBuilding";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for editing the buildings server-side on player requests */
export const ServerBuildingRequestHandler = {
	placeBlocks: (player: Player, request: PlaceBlocksRequest): MultiBuildResponse => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}

		for (const block of request.blocks) {
			if (
				!BuildingManager.serverBlockCanBePlacedAt(
					SharedPlots.getPlotComponent(request.plot),
					blockRegistry.get(block.id)!,
					block.location,
					player,
				)
			) {
				return err("Out of bounds");
			}

			// if block with the same uuid already exists
			if (block.uuid !== undefined && request.plot.Blocks.FindFirstChild(block.uuid)) {
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
			const regblock = blockRegistry.get(id)!;
			const placed = SharedPlots.getPlotBlocks(request.plot)
				.GetChildren(undefined)
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

			PartUtils.applyToAllDescendantsOfType("Sound", placedBlock.model, (sound) => {
				sound.SetAttribute("owner", player.UserId);
			});

			PartUtils.applyToAllDescendantsOfType("ParticleEmitter", placedBlock.model, (sound) => {
				sound.SetAttribute("owner", player.UserId);
			});
		}

		return {
			success: true,
			models: placed,
		};
	},
	deleteBlocks: (player: Player, request: DeleteBlocksRequest): Response => {
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
	},
	moveBlocks: (player: Player, request: MoveBlocksRequest): Response => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}

		if (SharedBuilding.isBlocks(request.blocks)) {
			for (const block of request.blocks) {
				if (!SharedPlots.isBlockOnAllowedPlot(player, block)) {
					return errBuildingNotPermitted;
				}
			}
		}

		return ServerBuilding.moveBlocks(request);
	},
	logicConnect: (player: Player, request: LogicConnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.outputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicConnect(request);
	},
	logicDisconnect: (player: Player, request: LogicDisconnectRequest): Response => {
		if (!SharedPlots.isBlockOnAllowedPlot(player, request.inputBlock)) {
			return errBuildingNotPermitted;
		}

		return ServerBuilding.logicDisconnect(request);
	},
	paintBlocks: (player: Player, request: PaintBlocksRequest): Response => {
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
	},
	updateConfig: (player: Player, request: ConfigUpdateRequest): Response => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const config of request.configs) {
			if (!SharedPlots.isBlockOnAllowedPlot(player, config.block)) {
				return errBuildingNotPermitted;
			}
		}

		return ServerBuilding.updateConfig(request);
	},
	resetConfig: (player: Player, request: ConfigResetRequest): Response => {
		if (!SharedPlots.isBuildingAllowed(request.plot, player)) {
			return errBuildingNotPermitted;
		}
		for (const block of request.blocks) {
			if (!SharedPlots.isBlockOnAllowedPlot(player, block)) {
				return errBuildingNotPermitted;
			}
		}

		return ServerBuilding.resetConfig(request);
	},
} as const;
