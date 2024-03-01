import { RunService } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import { AABB } from "shared/fixes/AABB";
import VectorUtils from "shared/utils/VectorUtils";

/** Methods for for getting information about blocks in a building */
const BuildingManager = {
	AllowedMaterials: [
		Enum.Material.Brick,
		Enum.Material.Cobblestone,
		Enum.Material.Concrete,
		Enum.Material.DiamondPlate,
		Enum.Material.Fabric,
		Enum.Material.Glass,
		Enum.Material.Granite,
		Enum.Material.Grass,
		Enum.Material.Ice,
		Enum.Material.Marble,
		Enum.Material.Metal,
		Enum.Material.Pebble,
		Enum.Material.WoodPlanks,
		Enum.Material.Plastic,
		Enum.Material.CorrodedMetal,
		Enum.Material.Sand,
		Enum.Material.Slate,
		Enum.Material.Wood,
	] as readonly Enum.Material[],

	/** Returns the block by its uuid */
	getBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel | undefined {
		return plot.Blocks.FindFirstChild(uuid) as BlockModel | undefined;
	},

	/** Returns the block by its uuid, checks every plot */
	getBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel | undefined {
		const plot = SharedPlots.plots.find((plot) => this.getBlockByUuid(plot.instance, uuid) !== undefined)?.instance;
		if (!plot) return undefined;

		return this.getBlockByUuid(plot, uuid);
	},

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 * @deprecated slow & stupid
	 */
	getBlockByPosition(vector: Vector3): BlockModel | undefined {
		const plot = SharedPlots.getPlotByPosition(vector);
		if (!plot) {
			return undefined;
		}

		const blocks = plot.Blocks.GetChildren(undefined);
		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i];
			if (
				VectorUtils.roundVectorToNearestHalf(block.GetPivot().Position) ===
				VectorUtils.roundVectorToNearestHalf(vector)
			) {
				return block;
			}
		}

		return undefined;
	},

	/** Check that the block position for a given player is a permitted position and not occupied by any other block
	 * @param position The position to check
	 * @param player The player to check
	 */
	blockCanBePlacedAt(plot: PlotModel, block: BlockModel, cframe: CFrame, player: Player): boolean {
		// Checking the plot
		if (!SharedPlots.isBuildingAllowed(plot, player)) {
			// No plot / Building forbidden
			return false;
		}

		// Not in plot
		if (!SharedPlots.getPlotBuildingRegion(plot).contains(AABB.fromModel(block))) {
			return false;
		}

		if (RunService.IsClient()) {
			// Check is given coordinate occupied by another block
			const collideBlock = this.getBlockByPosition(cframe.Position);
			if (collideBlock !== undefined) {
				// Occupied coordinates
				return false;
			}
		}

		// OK
		return true;
	},

	getMirroredBlocksCFrames(plot: Model, cframeToMirror: CFrame, axes: readonly CFrame[]): readonly CFrame[] {
		const reflect = (cframe: CFrame, mirrorCFrame: CFrame) => {
			const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = mirrorCFrame
				.ToObjectSpace(cframe)
				.GetComponents();

			// reflect along X/Y plane (Z axis)
			const reflection = new CFrame(X, Y, -Z, -R00, R01, R02, -R10, R11, R12, R20, -R21, -R22);
			const reflectedCFrame = mirrorCFrame.ToWorldSpace(reflection);
			const [x, y, z] = reflectedCFrame.ToOrientation();

			return CFrame.fromOrientation(x, y, z).add(reflectedCFrame.Position);
		};

		const plotframe = plot.GetPivot();

		const ret: CFrame[] = [cframeToMirror];
		for (const axis of axes) {
			for (const frame of [...ret]) {
				ret.push(reflect(frame, plotframe.ToWorldSpace(axis)));
			}
		}

		ret.remove(0);
		return ret;
	},
} as const;

export default BuildingManager;
