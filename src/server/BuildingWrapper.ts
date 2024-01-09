import { HttpService } from "@rbxts/services";
import MaterialPhysicalProperties from "shared/MaterialPhysicalProperties";
import { blockRegistry } from "shared/Registry";
import Serializer from "shared/Serializer";
import Objects from "shared/_fixes_/objects";
import BlockManager from "shared/building/BlockManager";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import PartUtils from "shared/utils/PartUtils";
import VectorUtils from "shared/utils/VectorUtils";
import BuildingWelder from "./BuildingWelder";
import ServerPlots from "./plots/ServerPlots";

export default class BuildingWrapper {
	public static tryGetValidPlotByBlock(
		this: void,
		player: Player,
		block: BlockModel,
	): (SuccessResponse & { plot: PlotModel }) | ErrorResponse {
		const plot = SharedPlots.getPlotByBlock(block);

		// No plot?
		if (plot === undefined) {
			return {
				success: false,
				message: "Plot not found",
			};
		}

		// Plot is forbidden
		if (!BuildingManager.isBuildingAllowed(plot, player)) {
			return {
				success: false,
				message: "Building is not permitted",
			};
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
		const blocks = plot.Blocks;

		const pivot = blocks.GetBoundingBox()[0];
		const size = blocks.GetExtentsSize();

		function gridRound(value: number) {
			return math.round(value * 2) / 2;
		}

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
			if (!BuildingManager.isBuildingAllowed(plot, player)) {
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
		BuildingWelder.unweld(block);
		block.Destroy();

		return { success: true };
	}

	public static placeSingleBlockAsPlayer(
		this: void,
		player: Player,
		data: ExcludeMembers<PlaceBlockRequest, "mirrors">,
	): BuildResponse {
		// Check is in plot
		if (!BuildingManager.blockCanBePlacedAt(data.location.Position, player)) {
			return {
				success: false,
				message: "Out of bounds",
			};
		}

		// Check is limit exceeded
		const plot = SharedPlots.getPlotByPosition(data.location.Position);
		if (!plot)
			return {
				success: false,
				message: "Out of bounds",
			};

		const block = blockRegistry.get(data.id)!;
		const placedBlocks = SharedPlots.getPlotBlocks(plot)
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
		for (const pos of Objects.values(mirrorPositions)) {
			const result = BuildingWrapper.placeSingleBlockAsPlayer(player, {
				...data,
				location: pos,
			});

			if (!result.success) return result;
		}*/
	}
	public static placeBlock(this: void, data: PlaceBlockRequest): BuildResponse {
		const plot = SharedPlots.getPlotByPosition(data.location.Position);
		if (!plot) {
			return {
				success: false,
				message: "Plot not found",
			};
		}

		const block = blockRegistry.get(data.id)!;

		// Create a new instance of the building model
		const model = block.model.Clone();
		model.SetAttribute("id", data.id);

		model.PivotTo(data.location);
		model.Parent = plot.FindFirstChild("Blocks");

		// Set material & color
		model.SetAttribute("material", Serializer.EnumMaterialSerializer.serialize(data.material));
		model.SetAttribute("color", HttpService.JSONEncode(Serializer.Color3Serializer.serialize(data.color)));
		if (data.config && Objects.keys(data.config).size() !== 0) {
			model.SetAttribute("config", HttpService.JSONEncode(data.config));
		}

		model.SetAttribute("uuid", data.uuid ?? HttpService.GenerateGUID(false));

		PartUtils.switchDescendantsMaterial(model, data.material);
		PartUtils.switchDescendantsColor(model, data.color);

		// Make transparent glass material
		if (data.material === Enum.Material.Glass) {
			PartUtils.switchDescendantsTransparency(model, 0.3);
		}

		// Custom physical properties
		const customPhysProp =
			MaterialPhysicalProperties.Properties[data.material.Name] ?? MaterialPhysicalProperties.Properties.Default;

		PartUtils.applyToAllDescendantsOfType("BasePart", model, (part) => {
			if (!part.CustomPhysicalProperties) {
				const currentPhysProp = part.CurrentPhysicalProperties;
				part.CustomPhysicalProperties = new PhysicalProperties(
					customPhysProp.Density ?? currentPhysProp.Density,
					customPhysProp.Friction ?? currentPhysProp.Friction,
					customPhysProp.Elasticity ?? currentPhysProp.Elasticity,
					customPhysProp.FrictionWeight ?? currentPhysProp.FrictionWeight,
					customPhysProp.ElasticityWeight ?? currentPhysProp.ElasticityWeight,
				);
			}
		});

		// Weld block
		BuildingWelder.weld(model, plot);

		return { success: true, model: model };
	}

	public static updateConfigAsPlayer(this: void, player: Player, data: ConfigUpdateRequest): Response {
		for (const block of data.blocks) {
			const plot = BuildingWrapper.tryGetValidPlotByBlock(player, block);
			if (!plot.success) return plot;
		}

		return BuildingWrapper.updateConfig(data);
	}
	public static updateConfig(this: void, data: ConfigUpdateRequest): Response {
		for (const block of data.blocks) {
			const dataTag = block.GetAttribute("config") as string | undefined;
			const currentData = HttpService.JSONDecode(dataTag ?? "{}") as { [key: string]: string };
			currentData[data.data.key] = data.data.value;
			block.SetAttribute("config", HttpService.JSONEncode(currentData));
		}

		return { success: true };
	}

	static updateLogicConnectionAsPlayer(this: void, player: Player, data: UpdateLogicConnectionRequest): Response {
		for (const block of [data.fromBlock, data.toBlock]) {
			const plot = BuildingWrapper.tryGetValidPlotByBlock(player, block);
			if (!plot.success) return plot;
		}

		return BuildingWrapper.updateLogicConnection(data);
	}
	static updateLogicConnection(this: void, data: UpdateLogicConnectionRequest): Response {
		const fromInfo = BlockManager.getBlockDataByBlockModel(data.fromBlock);
		const toInfo = BlockManager.getBlockDataByBlockModel(data.toBlock);

		if (data.operation === "connect") {
			const connections = {
				...fromInfo.connections,
				[data.fromConnection]: {
					blockUuid: toInfo.uuid,
					connectionName: data.toConnection,
				},
			};

			data.fromBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		}

		if (data.operation === "disconnect") {
			const connections = { ...fromInfo.connections };
			if (connections[data.fromConnection]) {
				delete connections[data.fromConnection];
			}

			data.fromBlock.SetAttribute("connections", HttpService.JSONEncode(connections));
		}

		return {
			success: false,
			message: "Invalid operation",
		};
	}
}
