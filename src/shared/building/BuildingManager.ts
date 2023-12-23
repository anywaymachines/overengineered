import SharedPlots from "shared/building/SharedPlots";
import VectorUtils from "shared/utils/VectorUtils";

export type MirrorBlocksCFrames = {
	readonly Main: CFrame;

	readonly X?: CFrame;
	readonly Y?: CFrame;
	readonly Z?: CFrame;

	readonly XZ?: CFrame;
	readonly XY?: CFrame;
	readonly YZ?: CFrame;

	readonly XYZ?: CFrame;
};

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
	public static isBuildingAllowed(plot: Model, player: Player) {
		const data = SharedPlots.readPlotData(plot);
		return data.ownerID === player.UserId || data.whitelistedPlayerIDs.includes(player.UserId);
	}

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 */
	public static getBlockByPosition(vector: Vector3): Model | undefined {
		const plot = SharedPlots.getPlotByPosition(vector);
		if (!plot) {
			// No plot => No block
			return undefined;
		}

		const blocks = (plot.FindFirstChild("Blocks") as Folder).GetChildren();
		for (let i = 0; i < blocks.size(); i++) {
			const block = blocks[i] as Model;
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

	public static getBlocksCFramesWithMirrored(
		plot: Model,
		mainPosition: Vector3,
		axis: BlockMirrorParams,
	): MirrorBlocksCFrames {
		const center = plot.GetPivot().Position.add(new Vector3(axis.X ?? 0, axis.Y ?? 0, axis.Z ?? 0));
		const offsetx2 = mainPosition.sub(center).mul(-2);

		// TODO: rotations

		return {
			Main: new CFrame(mainPosition),
			X: new CFrame(mainPosition.add(new Vector3(offsetx2.X, 0, 0))),
			Y: new CFrame(mainPosition.add(new Vector3(0, offsetx2.Y, 0))),
			Z: new CFrame(mainPosition.add(new Vector3(0, 0, offsetx2.Z))),

			XY: new CFrame(mainPosition.add(new Vector3(offsetx2.X, offsetx2.Y, 0))),
			YZ: new CFrame(mainPosition.add(new Vector3(0, offsetx2.Y, offsetx2.Z))),
			XZ: new CFrame(mainPosition.add(new Vector3(offsetx2.X, 0, offsetx2.Z))),

			XYZ: new CFrame(mainPosition.add(offsetx2)),
		};
	}
}
