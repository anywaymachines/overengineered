import { HttpService } from "@rbxts/services";
import { blockRegistry } from "shared/Registry";
import BlockManager, { PlacedBlockData } from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import JSON, { JsonSerializablePrimitive } from "shared/fixes/Json";
import Objects from "shared/fixes/objects";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";
import BuildingWelder from "./BuildingWelder";
import ServerPlots from "./plots/ServerPlots";

const errorPlotNotFound = (): ErrorResponse => {
	return {
		success: false,
		message: "Plot not found",
	};
};
const errorBuildingNotPermitted = (): ErrorResponse => {
	return {
		success: false,
		message: "Building is not permitted",
	};
};

export default class BuildingWrapper {
	public static tryGetValidPlotByBlock(
		this: void,
		player: Player,
		block: BlockModel,
	): (SuccessResponse & { plot: PlotModel }) | ErrorResponse {
		const plot = SharedPlots.getPlotByBlock(block);

		// No plot?
		if (plot === undefined) {
			return errorPlotNotFound();
		}

		// Plot is forbidden
		if (!SharedPlots.isBuildingAllowed(plot, player)) {
			return errorBuildingNotPermitted();
		}

		return {
			success: true,
			plot,
		};
	}

	public static movePlotAsPlayer(this: void, player: Player, data: PlayerMoveRequest): Response {
		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		return BuildingWrapper.movePlot(plot, data);
	}

	public static movePlot(this: void, plot: PlotModel, data: PlayerMoveRequest): Response {
		if (data.blocks === "all") {
			const blocks = plot.Blocks;
			const pivot = blocks.GetBoundingBox()[0];
			const size = blocks.GetExtentsSize();

			const gridRound = (value: number) => math.round(value * 2) / 2;

			const p1 = pivot.PointToWorldSpace(size.div(2).mul(-1));
			const p2 = pivot.PointToWorldSpace(size.div(2));

			const min = new Vector3(
				gridRound(math.min(p1.X, p2.X)),
				gridRound(math.min(p1.Y, p2.Y)),
				gridRound(math.min(p1.Z, p2.Z)),
			)
				.add(data.vector)
				.add(Vector3.one);
			const max = new Vector3(
				gridRound(math.max(p1.X, p2.X)),
				gridRound(math.max(p1.Y, p2.Y)),
				gridRound(math.max(p1.Z, p2.Z)),
			)
				.add(data.vector)
				.sub(Vector3.one);

			const blocksRegion = new Region3(min, max);

			if (!VectorUtils.isRegion3InRegion3(blocksRegion, SharedPlots.getPlotBuildingRegion(plot))) {
				return {
					success: false,
					message: "Out of bounds!",
				};
			}

			blocks.PivotTo(blocks.GetPivot().add(data.vector));
		} else {
			const blocks = data.blocks;
			const pivot = blocks[0].GetPivot();
			const size = BuildingManager.getBlocksAABB(blocks).Size;

			const gridRound = (value: number) => math.round(value * 2) / 2;

			const p1 = pivot.PointToWorldSpace(size.div(2).mul(-1));
			const p2 = pivot.PointToWorldSpace(size.div(2));

			const min = new Vector3(
				gridRound(math.min(p1.X, p2.X)),
				gridRound(math.min(p1.Y, p2.Y)),
				gridRound(math.min(p1.Z, p2.Z)),
			)
				.add(data.vector)
				.add(Vector3.one);
			const max = new Vector3(
				gridRound(math.max(p1.X, p2.X)),
				gridRound(math.max(p1.Y, p2.Y)),
				gridRound(math.max(p1.Z, p2.Z)),
			)
				.add(data.vector)
				.sub(Vector3.one);

			const blocksRegion = new Region3(min, max);

			if (!VectorUtils.isRegion3InRegion3(blocksRegion, SharedPlots.getPlotBuildingRegion(plot))) {
				return {
					success: false,
					message: "Out of bounds!",
				};
			}

			for (const block of blocks) {
				BuildingWelder.unweldFromOtherBlocks(block);
				block.PivotTo(block.GetPivot().add(data.vector));
				BuildingWelder.weld(block);
			}
		}

		return {
			success: true,
		};
	}

	public static deleteBlockAsPlayer(this: void, player: Player, data: PlayerDeleteBlockRequest): Response {
		if (data === "all") {
			const plot = SharedPlots.getPlotByOwnerID(player.UserId);
			return BuildingWrapper.clearPlot(plot);
		}

		for (const block of data) {
			const plot = SharedPlots.getPlotByBlock(block);

			// No plot?
			if (plot === undefined) {
				return {
					success: false,
					message: "Plot not found",
				};
			}

			// Plot is forbidden
			if (!SharedPlots.isBuildingAllowed(plot, player)) {
				return {
					success: false,
					message: "Building is not permitted",
				};
			}

			const response = BuildingWrapper.deleteBlock(block);
			if (!response.success) return response;
		}

		return { success: true };
	}

	public static clearPlot(this: void, plot: PlotModel): Response {
		ServerPlots.clearAllBlocks(plot);
		return { success: true };
	}

	public static deleteBlock(this: void, block: BlockModel): Response {
		const plot = SharedPlots.getPlotByBlock(block);
		if (!plot)
			return {
				success: false,
				message: "No plot",
			};

		const data = BlockManager.getBlockDataByBlockModel(block);
		for (const otherblock of SharedPlots.getPlotBlockDatas(plot)) {
			for (const [connector, connection] of Objects.pairs(otherblock.connections)) {
				if (connection.blockUuid !== data.uuid) continue;

				BuildingWrapper.updateLogicConnection({
					operation: "disconnect",
					inputBlock: otherblock.instance,
					inputConnection: connector,
				});
			}
		}

		const unwelded = BuildingWelder.unweld(block);
		/*for (const [root] of Arrays.groupBySet(unwelded, (p) => p.AssemblyRootPart!)) {
			root.Anchored = true;
		}*/

		block.Destroy();

		return { success: true };
	}

	public static placeSingleBlockAsPlayer(
		this: void,
		player: Player,
		data: ExcludeMembers<PlaceBlockRequest, "mirrors">,
	): BuildResponse {
		// Check is in plot
		if (!BuildingManager.blockCanBePlacedAt(data.plot, blockRegistry.get(data.id)!.model, data.location, player)) {
			return {
				success: false,
				message: "Out of bounds",
			};
		}

		const block = blockRegistry.get(data.id)!;
		const placedBlocks = SharedPlots.getPlotBlocks(data.plot)
			.GetChildren()
			.filter((placed_block) => {
				return placed_block.GetAttribute("id") === data.id;
			})
			.size();
		if (placedBlocks >= block.limit) {
			return {
				success: false,
				message: "Type limit exceeded",
			};
		}

		const placedBlock = BuildingWrapper.placeBlock(data);

		if (placedBlock.success) {
			PartUtils.applyToAllDescendantsOfType("Sound", placedBlock.model, (sound) => {
				sound.SetAttribute("owner", player.UserId);
			});

			PartUtils.applyToAllDescendantsOfType("ParticleEmitter", placedBlock.model, (sound) => {
				sound.SetAttribute("owner", player.UserId);
			});
		}

		return placedBlock;
	}

	public static placeBlockAsPlayer(this: void, player: Player, data: PlaceBlockRequest): BuildResponse {
		if (data.uuid !== undefined) {
			return {
				success: false,
				message: "Invalid request",
			};
		}

		const result = BuildingWrapper.placeSingleBlockAsPlayer(player, data);
		return result;

		/*if (!result.success) return result;
		
		const plot = SharedPlots.getPlotByPosition(data.location.Position) as Model;
		const mirrorPositions = BuildingManager.getMirrorBlocksCFrames(plot, data.location.Position, data.mirrors);
		for (const [, pos] of Objects.pairs(mirrorPositions)) {
			const result = BuildingWrapper.placeSingleBlockAsPlayer(player, {
				...data,
				location: pos,
			});

			if (!result.success) return result;
		}*/
	}
	public static placeBlock(this: void, data: PlaceBlockRequest): BuildResponse {
		const block = blockRegistry.get(data.id)!;

		// Create a new instance of the building model
		const model = block.model.Clone();
		model.SetAttribute("id", data.id);

		model.PivotTo(data.location);

		// Set material & color
		if (data.config && Objects.keys(data.config).size() !== 0) {
			model.SetAttribute("config", JSON.serialize(data.config));
		}

		const uuid = data.uuid ?? HttpService.GenerateGUID(false);
		model.SetAttribute("uuid", uuid);
		model.Name = uuid;

		SharedBuilding.paint({ blocks: [model], color: data.color, material: data.material }, true);

		model.Parent = data.plot.Blocks;

		// Weld block
		const newJoints = BuildingWelder.weld(model);
		/*if (newJoints.size() !== 0) {
			PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
				if (part.Name.lower() === "colbox") return;
				part.Anchored = false;
			});

			for (const part of newJoints) {
				if (part.AssemblyRootPart?.Parent === model) continue;

				PartUtils.applyToAllDescendantsOfType("BasePart", part.AssemblyRootPart!.Parent!, (part) => {
					part.Anchored = false;
				});
			}

			if (!model.PrimaryPart!.AssemblyRootPart!.Anchored) {
				model.PrimaryPart!.Anchored = true;
			}
		}*/

		return { success: true, model: model };
	}

	public static updateConfigAsPlayer(this: void, player: Player, data: ConfigUpdateRequest): Response {
		for (const config of data.configs) {
			const plot = BuildingWrapper.tryGetValidPlotByBlock(player, config.block);
			if (!plot.success) return plot;
		}

		return BuildingWrapper.updateConfig(data);
	}
	public static updateConfig(this: void, data: ConfigUpdateRequest): Response {
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
			for (const [key, val] of Objects.pairs(value as Record<string, JsonSerializablePrimitive | object>)) {
				const rk = ret[key];

				if (typeIs(rk, "Vector3") || !typeIs(rk, "table")) {
					ret[key] = val;
				} else {
					ret[key] = setobj(rk as Record<string, JsonSerializablePrimitive | object>, key, val);
				}
			}

			return ret;
		};

		for (const config of data.configs) {
			const dataTag = config.block.GetAttribute("config") as string | undefined;
			const currentData = JSON.deserialize(dataTag ?? "{}") as Record<string, JsonSerializablePrimitive>;

			const newData = withValues(currentData, { [config.key]: JSON.deserialize(config.value) });
			config.block.SetAttribute("config", JSON.serialize(newData as JsonSerializablePrimitive));
		}

		return { success: true };
	}

	static updateLogicConnectionAsPlayer(this: void, player: Player, data: UpdateLogicConnectionRequest): Response {
		const plot1 = BuildingWrapper.tryGetValidPlotByBlock(player, data.inputBlock);
		if (!plot1.success) return plot1;

		if (data.operation === "connect") {
			const plot2 = BuildingWrapper.tryGetValidPlotByBlock(player, data.outputBlock);
			if (!plot2.success) return plot2;
		}

		return BuildingWrapper.updateLogicConnection(data);
	}
	static updateLogicConnection(this: void, data: UpdateLogicConnectionRequest): Response {
		const inputInfo = BlockManager.getBlockDataByBlockModel(data.inputBlock);

		if (data.operation === "connect") {
			const outputInfo = BlockManager.getBlockDataByBlockModel(data.outputBlock);

			const connections: PlacedBlockData["connections"] = {
				...inputInfo.connections,
				[data.inputConnection]: {
					blockUuid: outputInfo.uuid,
					connectionName: data.outputConnection,
				},
			};

			data.inputBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		}

		if (data.operation === "disconnect") {
			const connections = { ...inputInfo.connections };
			if (connections[data.inputConnection]) {
				delete connections[data.inputConnection];
			}

			data.inputBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		}

		return {
			success: false,
			message: "Invalid operation",
		};
	}

	static paintAsPlayer(this: void, player: Player, data: PaintRequest): Response {
		if ("blocks" in data) {
			for (const block of data.blocks) {
				const plot = BuildingWrapper.tryGetValidPlotByBlock(player, block);
				if (!plot.success) return plot;
			}
		} else {
			if (!SharedPlots.isBuildingAllowed(data.plot, player)) {
				return errorBuildingNotPermitted();
			}
		}

		return SharedBuilding.paint(data);
	}
}
