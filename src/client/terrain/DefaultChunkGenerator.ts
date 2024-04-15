import { type ChunkGenerator } from "client/terrain/ChunkLoader";
import { TerrainDataInfo } from "shared/TerrainDataInfo";

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

		height += terrainData.shift;
		height = math.clamp(height, terrainData.minimumHeight, terrainData.maximumHeight);

		return height;
	},
};
