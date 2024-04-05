import { Players, RunService } from "@rbxts/services";
import { BlockDataRegistry } from "shared/BlockDataRegistry";
import { SharedPlot } from "shared/building/SharedPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { VectorUtils } from "shared/utils/VectorUtils";

/** Methods for for getting information about blocks in a building */
export namespace BuildingManager {
	export const AllowedMaterials: readonly Enum.Material[] = [
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
	];

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 * @deprecated slow & stupid
	 */
	export function getBlockByPosition(vector: Vector3): BlockModel | undefined {
		const plot = SharedPlots.getPlotByPosition(vector);
		if (!plot) {
			return undefined;
		}

		const blocks = SharedPlots.getPlotComponent(plot).getBlocks();
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

	export function blockCanBePlacedAt(plot: SharedPlot, block: { readonly model: Model }, pivot: CFrame): boolean {
		return serverBlockCanBePlacedAt(plot, block, pivot, Players.LocalPlayer);
	}

	export function serverBlockCanBePlacedAt(
		plot: SharedPlot,
		block: { readonly model: Model },
		pivot: CFrame,
		player: Player,
	): boolean {
		if (!plot.isBuildingAllowed(player ?? Players.LocalPlayer)) {
			return false;
		}

		if (!plot.isModelInside(block.model, pivot)) {
			return false;
		}

		if (RunService.IsClient()) {
			const collideBlock = getBlockByPosition(pivot.Position);
			if (collideBlock) {
				return false;
			}
		}

		// OK
		return true;
	}

	export function getMirroredBlocksCFrames(
		plot: PlotModel,
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

		const plotframe = plot.BuildingArea.GetPivot();

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
	}
}
