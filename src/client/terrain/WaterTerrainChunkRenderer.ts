import { Workspace } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { ChunkRenderer } from "client/terrain/ChunkLoader";

export const WaterTerrainChunkRenderer = (): ChunkRenderer<true> => {
	const chunkSize = 16;
	const height = 400;
	const terrain = Workspace.WaitForChild("Terrain") as Terrain;

	const getRegion = (startX: number, startZ: number) => {
		const endX = startX + chunkSize - 1;
		const endZ = startZ + chunkSize - 1;

		return new Region3(
			new Vector3(startX * 4, -height + GameDefinitions.HEIGHT_OFFSET, startZ * 4),
			new Vector3(endX * 4 + 4, GameDefinitions.HEIGHT_OFFSET, endZ * 4 + 4),
		);
	};

	const [emptyMaterials, emptyOccupancys] = terrain.ReadVoxels(getRegion(0, 0), 4);
	const [waterMaterials, waterOccupancys] = terrain.ReadVoxels(getRegion(0, 0), 4);
	for (let x = 0; x < waterMaterials.size(); x++) {
		for (let y = 0; y < waterMaterials[x].size(); y++) {
			for (let z = 0; z < waterMaterials[x][y].size(); z++) {
				waterMaterials[x][y][z] = Enum.Material.Water;
				waterOccupancys[x][y][z] = 1;
			}
		}
	}
	for (let x = 0; x < waterMaterials.size(); x++) {
		for (let z = 0; z < waterMaterials[x][0].size(); z++) {
			waterMaterials[x][0][z] = Enum.Material.Sand;
		}
	}

	return {
		chunkSize: chunkSize * 4,

		renderChunk(chunkX: number, chunkZ: number): true {
			if (math.random() > 0.9) task.wait();
			const startX = chunkX * chunkSize;
			const startZ = chunkZ * chunkSize;

			const region = getRegion(startX, startZ);
			terrain.WriteVoxels(region, 4, waterMaterials, waterOccupancys);

			return true;
		},
		destroyChunk(chunkX: number, chunkZ: number): void {
			if (math.random() > 0.9) task.wait();
			const startX = chunkX * chunkSize;
			const startZ = chunkZ * chunkSize;

			const region = getRegion(startX, startZ);
			terrain.WriteVoxels(region, 4, emptyMaterials, emptyOccupancys);
		},
		unloadAll(chunks) {
			2;
			Workspace.Terrain.Clear();
			Workspace.Terrain.ClearAllChildren();
		},
		destroy() {},
	};
};
