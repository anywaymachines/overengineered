import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export default class BuildingManager {
	public static AllowedMaterials = [
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
	];

	/** Checks that building for a player on a given Plot is allowed
	 * @param plot The Plot to check
	 * @param player The player to check
	 */
	public static isBuildingAllowed(plot: PlotModel, player: Player) {
		const data = SharedPlots.readPlotData(plot);
		return data.ownerID === player.UserId || data.whitelistedPlayerIDs.includes(player.UserId);
	}

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 */
	public static getBlockByPosition(vector: Vector3): BlockModel | undefined {
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
	public static blockCanBePlacedAt(position: Vector3, player: Player): boolean {
		// Checking the plot
		const plot = SharedPlots.getPlotByPosition(position);
		if (plot === undefined || !this.isBuildingAllowed(plot, player)) {
			// No plot / Building forbidden
			return false;
		}

		// Check is given coordinate occupied by another block
		const collideBlock = this.getBlockByPosition(position);
		if (collideBlock !== undefined) {
			// Occupied coordinates
			return false;
		}

		// OK
		return true;
	}

	/** Check that the position for a given player is a permitted position
	 * @param position The position to check
	 * @param player The player to check
	 * @deprecated Use blockCanBePlacedAt
	 */
	public static vectorAbleToPlayer(position: Vector3, player: Player): boolean {
		// Checking the plot
		const plot = SharedPlots.getPlotByPosition(position);
		if (plot === undefined || !this.isBuildingAllowed(plot, player)) {
			// No plot / Building forbidden
			return false;
		}

		// Check is given coordinate occupied by another block
		const collideBlock = this.getBlockByPosition(position);
		if (collideBlock !== undefined) {
			// Occupied coordinates
			return false;
		}

		// OK
		return true;
	}

	static time = 0;
	public static getMirroredBlocksCFrames(
		plot: Model,
		cframeToMirror: CFrame,
		axes: readonly CFrame[],
	): readonly CFrame[] {
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
