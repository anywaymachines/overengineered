import { RunService } from "@rbxts/services";
import { BlockDataRegistry } from "shared/BlockDataRegistry";
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
		if (
			!SharedPlots.getPlotBuildingRegion(plot).contains(
				AABB.fromCenterSize(block.GetPivot().Position, block.GetBoundingBox()[1])
					.withCenter(cframe)
					.withSize((s) => s.mul(0.9)), // to account for inaccuracies
			)
		) {
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

	getMirroredBlocksCFrames(
		plot: Model,
		blockid: string,
		cframeToMirror: CFrame,
		mode: MirrorMode,
	): readonly CFrame[] {
		const method = BlockDataRegistry[blockid]?.mirrorBehaviour ?? "normal";
		const [xAxis, yAxis, zAxis] = [Vector3.xAxis, Vector3.yAxis, Vector3.zAxis];

		const reflect = (cframe: CFrame, mode: "x" | "y" | "z", mirrorCFrame: CFrame) => {
			const pos = cframe.Position;

			function normalRotation() {
				const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = mirrorCFrame
					.ToObjectSpace(cframe)
					.GetComponents();

				const reflection = new CFrame(X, Y, -Z, -R00, R01, R02, -R10, R11, R12, R20, -R21, -R22);
				const reflectedCFrame = mirrorCFrame.ToWorldSpace(reflection);
				cframe = reflectedCFrame.Rotation;
			}

			// apply rotation only
			switch (method) {
				case "none":
					break;
				case "offset90":
					cframe = cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi / 2, 0));
					normalRotation();
					break;
				case "offset180":
					cframe = cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi, 0));
					normalRotation();
					break;
				case "offset270":
					cframe = cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi * 1.5, 0));
					normalRotation();
					break;
				case "normal": {
					normalRotation();
					break;
				}
				case "wedgeWing": {
					const round = (vec: Vector3) =>
						new Vector3(math.round(vec.X), math.round(vec.Y), math.round(vec.Z));
					const [xvec, yvec, zvec] = [
						round(cframe.RightVector),
						round(cframe.UpVector),
						round(cframe.LookVector),
					];

					// Y targets Y
					if (yvec.Y !== 0) {
						if (mode === "x") cframe = CFrame.fromAxisAngle(xAxis, math.pi).mul(cframe);
						if (mode === "y") break;
						if (mode === "z") cframe = CFrame.fromAxisAngle(zAxis, math.pi).mul(cframe);
						break;
					}

					// Y targets X
					if (yvec.X !== 0) {
						if (mode === "x") cframe = CFrame.fromAxisAngle(yAxis, math.pi).mul(cframe);
						if (mode === "y") cframe = CFrame.fromAxisAngle(zAxis, math.pi).mul(cframe);
						if (mode === "z") break;
						break;
					}

					// Y targets Z
					if (mode === "x") break;
					if (mode === "y") cframe = CFrame.fromAxisAngle(xAxis, math.pi).mul(cframe);
					if (mode === "z") cframe = CFrame.fromAxisAngle(yAxis, math.pi).mul(cframe);
					break;
				}
			}

			// apply position \/
			const rpos = mirrorCFrame.PointToObjectSpace(pos);
			return new CFrame(mirrorCFrame.ToWorldSpace(new CFrame(rpos.X, rpos.Y, -rpos.Z)).Position).mul(
				cframe.Rotation,
			);
		};

		const plotframe = plot.GetPivot();

		const axes: ["x" | "y" | "z", CFrame][] = [];
		if (mode.y) axes.push(["y", CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(mode.y)]);
		if (mode.x) axes.push(["x", CFrame.identity.add(mode.x)]);
		if (mode.z) axes.push(["z", CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(mode.z)]);

		const ret: CFrame[] = [cframeToMirror];
		for (const [axe, axis] of axes) {
			for (const frame of [...ret]) {
				ret.push(reflect(frame, axe, plotframe.ToWorldSpace(axis)));
			}
		}
		ret.remove(0);
		return ret;
	},
} as const;

export default BuildingManager;
