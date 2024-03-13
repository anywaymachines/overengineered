import { blockRegistry } from "shared/Registry";
import BuildingManager from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";
import { ServerBuilding } from "./ServerBuilding";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };
const errPlotNotFound = err("Plot not found");
const errBuildingNotPermitted = err("Building is not permitted");
const errInvalidOperation = err("Invalid operation");

/** Methods for editing the buildings server-side on player requests */
export const ServerBuildingRequestHandler = {
	placeBlocks: (player: Player, request: PlaceBlocksByPlayerRequest): MultiBuildResponse => {
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
		}

		const placed: BlockModel[] = [];
		for (const block of request.blocks) {
			const regblock = blockRegistry.get(block.id)!;
			const placedBlocks = SharedPlots.getPlotBlocks(request.plot)
				.GetChildren()
				.filter((placed_block) => {
					return placed_block.GetAttribute("id") === block.id;
				})
				.size();
			if (placedBlocks >= (regblock.limit ?? 2000)) {
				return err("Type limit exceeded");
			}

			// round the coordinates
			(block as Writable<typeof block>).location = block.location.sub(
				block.location.Position.sub(VectorUtils.apply(block.location.Position, math.round)),
			);

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
} as const;
