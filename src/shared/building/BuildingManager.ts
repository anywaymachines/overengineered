import { RunService } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
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
	],

	/** Get an axis-aligned bounding box of a model */
	getModelAABB(block: Model): Region3 {
		const [cf, size] = block.GetBoundingBox();
		const sx = size.X;
		const sy = size.Y;
		const sz = size.Z;

		const [x, y, z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = cf.GetComponents();

		const wsx = 0.5 * (math.abs(R00) * sx + math.abs(R01) * sy + math.abs(R02) * sz);
		const wsy = 0.5 * (math.abs(R10) * sx + math.abs(R11) * sy + math.abs(R12) * sz);
		const wsz = 0.5 * (math.abs(R20) * sx + math.abs(R21) * sy + math.abs(R22) * sz);

		return new Region3(new Vector3(x - wsx, y - wsy, z - wsz), new Vector3(x + wsx, y + wsy, z + wsz));
	},

	/** Get a `Region3` that has all of the provided models inside */
	getBlocksAABB(models: readonly Model[]): Region3 {
		const min = (v1: Vector3, v2: Vector3): Vector3 =>
			new Vector3(math.min(v1.X, v2.X), math.min(v1.Y, v2.Y), math.min(v1.Z, v2.Z));

		let region = new Region3();
		for (const model of models) {
			const reg = this.getModelAABB(model);
			const regmin = reg.CFrame.Position.add(reg.Size.div(-2));
			const regmax = reg.CFrame.Position.add(reg.Size.div(2));

			const regionmin = region.CFrame.Position.add(region.Size.div(-2));
			const regionmax = region.CFrame.Position.add(region.Size.div(2));

			region = new Region3(min(regmin, regionmin), min(regmax, regionmax));
		}

		return region;
	},

	/** Returns the block by its uuid */
	getBlockByUuid(plot: PlotModel, uuid: BlockUuid): BlockModel | undefined {
		return plot.Blocks.FindFirstChild(uuid) as BlockModel | undefined;
	},

	/** Returns the block by its uuid, checks every plot */
	getBlockByUuidOnAnyPlot(uuid: BlockUuid): BlockModel | undefined {
		const plot = SharedPlots.plots.find((plot) => this.getBlockByUuid(plot, uuid) !== undefined);
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
		const plotRegion = SharedPlots.getPlotBuildingRegion(plot);

		const halfSize = block.PrimaryPart!.Size.div(2);
		const minPoint = cframe.Rotation.mul(halfSize.mul(-1)).add(cframe.Position);
		const maxPoint = cframe.Rotation.mul(halfSize).add(cframe.Position);
		const blockRegion = new Region3(minPoint, maxPoint);

		// Checking the plot
		if (!SharedPlots.isBuildingAllowed(plot, player)) {
			// No plot / Building forbidden
			return false;
		}

		// Not in plot
		if (!VectorUtils.isRegion3InRegion3(blockRegion, plotRegion)) return false;

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

			return CFrame.fromOrientation(x, y, z)
				.add(reflectedCFrame.Position)
				.mul(CFrame.fromEulerAnglesXYZ(0, math.pi / 2, 0));
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
