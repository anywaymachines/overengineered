import { Players } from "@rbxts/services";
import { BlockManager } from "shared/building/BlockManager";
import { BB } from "shared/fixes/BB";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { BlockId } from "shared/BlockDataRegistry";
import type { SharedPlot } from "shared/building/SharedPlot";

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

	export function getAssemblyBlocks(block: BlockModel): BlockModel[] {
		// using set to prevent duplicates
		return [
			...new Set(block.PrimaryPart!.GetConnectedParts(true).map((b) => BlockManager.tryGetBlockModelByPart(b)!)),
		];
	}
	export function getMachineBlocks(block: BlockModel): BlockModel[] {
		const find = (result: Set<BlockModel>, visited: Set<Instance>, instance: BlockModel) => {
			for (const part of instance.GetDescendants()) {
				if (!part.IsA("BasePart")) continue;

				const assemblyConnected = part.GetConnectedParts(false);
				for (const cpart of assemblyConnected) {
					if (cpart.Name === "HumanoidRootPart") continue;
					if (visited.has(cpart)) continue;

					visited.add(cpart);

					const connected = BlockManager.getBlockDataByPart(cpart)?.instance;
					if (!connected) {
						throw `CPart ${part.Name} is not a block`;
					}

					result.add(connected);
					find(result, visited, connected);
				}
			}
		};

		const result = new Set<BlockModel>();
		find(result, new Set(), block);

		return [...result];
	}

	/** Returns the block or nothing that is set on (or near) the given vector
	 * @param vector The vector to check
	 * @deprecated slow & stupid
	 */
	export function getBlockByPosition(plot: SharedPlot, vector: Vector3): BlockModel | undefined {
		const blocks = plot.getBlocks();
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

		if (!plot.bounds.isBBInside(BB.fromModel(block.model).withCenter(pivot))) {
			return false;
		}

		// temporarily removed because useless and easily bypassable by other tools
		/*if (RunService.IsClient()) {
			const collideBlock = getBlockByPosition(pivot.Position);
			if (collideBlock) {
				return false;
			}
		}*/

		// OK
		return true;
	}

	type MirroredBlock = {
		readonly id: BlockId;
		readonly pos: CFrame;
	};
	export function getMirroredBlocks(
		center: CFrame,
		origBlock: MirroredBlock,
		mode: MirrorMode,
		blockRegistry: BlockRegistry,
		filterSamePositions = false,
	): readonly MirroredBlock[] {
		const reflect = (block: MirroredBlock, mode: "x" | "y" | "z", mirrorCFrame: CFrame): MirroredBlock => {
			function rotate(cframe: CFrame): CFrame {
				function normalRotation(cframe: CFrame) {
					const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = mirrorCFrame
						.ToObjectSpace(cframe)
						.GetComponents();

					const reflection = new CFrame(X, Y, -Z, -R00, R01, R02, -R10, R11, R12, R20, -R21, -R22);
					const reflectedCFrame = mirrorCFrame.ToWorldSpace(reflection);
					return reflectedCFrame.Rotation;
				}

				const method = blockRegistry.blocks.get(origBlock.id)?.mirrorBehaviour ?? "normal";
				switch (method) {
					case "none":
						return cframe;
					case "offset90":
						return normalRotation(cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi / 2, 0)));
					case "offset180":
						return normalRotation(cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi, 0)));
					case "offset270":
						return normalRotation(cframe.mul(CFrame.fromEulerAnglesYXZ(0, math.pi * 1.5, 0)));
					case "normal": {
						return normalRotation(cframe);
					}
					case "wedgeWing": {
						const [x, y, z, x0, x1, x2, y0, y1, y2, z0, z1, z2] = cframe.GetComponents();
						if (mode === "x") {
							return new CFrame(x, y, z, x0, -x1, x2, y0, -y1, y2, -z0, z1, -z2);
						} else if (mode === "y") {
							return new CFrame(x, y, z, x0, -x1, x2, -y0, y1, -y2, z0, -z1, z2);
						} else if (mode === "z") {
							return new CFrame(x, y, z, -x0, x1, -x2, y0, -y1, y2, z0, -z1, z2);
						}

						throw "Unknown mode";
					}
					case "tetra": {
						return normalRotation(cframe.mul(CFrame.fromEulerAnglesYXZ(0, 0, math.pi * 1.5)));
					}
				}
			}

			const rotated = rotate(block.pos);
			const pos = mirrorCFrame.PointToObjectSpace(block.pos.Position);

			return {
				id: (blockRegistry.blocks.get(block.id)?.mirrorReplacementId as BlockId | undefined) ?? block.id,
				pos: new CFrame(mirrorCFrame.ToWorldSpace(new CFrame(pos.X, pos.Y, -pos.Z)).Position).mul(
					rotated.Rotation,
				),
			};
		};

		const axes: ["x" | "y" | "z", CFrame][] = [];
		if (mode.y !== undefined) {
			axes.push(["y", CFrame.fromAxisAngle(Vector3.xAxis, math.pi / 2).add(new Vector3(0, mode.y, 0))]);
		}
		if (mode.x !== undefined) {
			axes.push(["x", CFrame.identity.add(new Vector3(0, 0, mode.x))]);
		}
		if (mode.z !== undefined) {
			axes.push(["z", CFrame.fromAxisAngle(Vector3.yAxis, math.pi / 2).add(new Vector3(mode.z, 0, 0))]);
		}

		const origPos = VectorUtils.roundVector3(origBlock.pos.Position);
		const ret = new Map<Vector3, MirroredBlock>([[origPos, origBlock]]);
		for (const [axe, axis] of axes) {
			for (const [, frame] of [...ret]) {
				const reflected = reflect(frame, axe, center.ToWorldSpace(axis));
				ret.set(
					filterSamePositions ? VectorUtils.roundVector3(reflected.pos.Position) : reflected.pos.Position,
					reflected,
				);
			}
		}
		if (ret.size() !== 1) {
			ret.delete(origPos);
		}

		return ret.values();
	}
}
