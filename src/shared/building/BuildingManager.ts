import { RunService } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export default class BuildingManager {
	static readonly AllowedMaterials = [
		Enum.Material.Plastic,
		Enum.Material.Glass,
		Enum.Material.Wood,
		Enum.Material.WoodPlanks,
		Enum.Material.Metal,
		Enum.Material.Cobblestone,
		Enum.Material.Grass,
		Enum.Material.DiamondPlate,
		Enum.Material.Fabric,
		Enum.Material.Slate,
		Enum.Material.CorrodedMetal,
		Enum.Material.Foil,
		Enum.Material.Ice,
		Enum.Material.Sand,
		Enum.Material.Sandstone,
	];

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 * @deprecated slow & stupid
	 */
	static getBlockByPosition(vector: Vector3): BlockModel | undefined {
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
	}

	/** Check that the block position for a given player is a permitted position and not occupied by any other block
	 * @param position The position to check
	 * @param player The player to check
	 */
	static blockCanBePlacedAt(plot: PlotModel, block: BlockModel, cframe: CFrame, player: Player): boolean {
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
	}

	static time = 0;
	static getMirroredBlocksCFrames(plot: Model, cframeToMirror: CFrame, axes: readonly CFrame[]): readonly CFrame[] {
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
	}
}
