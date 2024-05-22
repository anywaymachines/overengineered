import { Workspace } from "@rbxts/services";
import { TerrainDataInfo } from "shared/TerrainDataInfo";
import type { ChunkGenerator } from "client/terrain/ChunkLoader";

const baseplate = Workspace.WaitForChild("Obstacles").WaitForChild("Baseplate") as BasePart;
const offset = baseplate.Position.div(4);
const size = baseplate.Size.div(4);
const slopefunc = (x: number, w: number) => math.max(-math.pow(x / w, -16) + 1, 0);

const terrainData = TerrainDataInfo.data;
const heightData: Record<number, Record<number, number>> = {};

export const DefaultChunkGenerator: ChunkGenerator = {
	getHeight(x: number, z: number): number {
		// if (heightData[x]?.[z] !== undefined) {
		// 	return heightData[x][z];
		// }

		let height = 0;
		for (const data of terrainData.noises) {
			const noise = math.noise(x * data[3], data[1], z * data[3]);
			height += math.clamp(noise, data[4], data[5]) * data[2];
		}

		height *= math.max(slopefunc(x - offset.X, size.X / 2 - 20), slopefunc(z - offset.Z, size.Z / 2 - 20));

		height += terrainData.shift;
		height = math.clamp(height, terrainData.minimumHeight, terrainData.maximumHeight);

		return height;
	},
};
