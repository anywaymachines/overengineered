import { ReplicatedFirst, Workspace } from "@rbxts/services";
import { TerrainData, TerrainInfo } from "shared/TerrainDataInfo";
import TerrainModelGenerator from "shared/TerrainModelGenerator";

const initialize = (controller: TerrainModelGenerator) => {
	const generateHeight = (x: number, z: number) => {
		if (heightData[x]?.[z] !== undefined) {
			return heightData[x][z];
		}

		let height = 0;
		for (const data of terrainData.noises) {
			const noise = math.noise((x + 1) * data[3], data[1], (z + 1) * data[3]);
			height += math.clamp(noise, data[4], data[5]) * data[2];
		}

		height += terrainData.shift;
		height = math.clamp(height, terrainData.minimumHeight, terrainData.maximumHeight);
		return height;
	};

	const folder = ReplicatedFirst.WaitForChild("Terrain") as Folder & TerrainInfo;
	const terrainChild = folder.Data.TerrainData;
	const heightChild = folder.Data.HeightData;
	const materialChild = folder.Data.MaterialData;
	if (!terrainChild) {
		throw "No terrin";
	}

	const chunkSize = folder.Configuration.ChunkSize.Value;
	const terrainData = require(folder.Data.TerrainData) as TerrainData;
	const heightData: number[][] = [];
	const materialData: number[][] = [];

	if (heightChild) {
		for (const child of heightChild.GetDescendants()) {
			if (child.ClassName !== "ModuleScript") {
				continue;
			}

			const data = require(child as ModuleScript) as [...[n: number, a: number[]]];
			const position = child.GetAttribute("Position") as Vector3;

			for (let i = 0; i < data.size(); i += 2) {
				const x = position.X + (data[i] as number);
				const zData = data[i + 1] as number[];

				heightData[x] ??= [];
				for (let j = 0; j < zData.size(); j += 2) {
					const z = position.Y + zData[j];
					const height = zData[j + 1];
					heightData[x][z] = height;
				}
			}
		}
	}

	if (materialChild) {
		for (const child of materialChild.GetDescendants()) {
			if (child.ClassName !== "ModuleScript") {
				continue;
			}

			const data = require(child as ModuleScript) as [...[n: number, a: number[]]];
			const position = child.GetAttribute("Position") as Vector3;

			for (let i = 0; i < data.size(); i += 2) {
				const x = position.X + (data[i] as number);
				const zData = data[i + 1] as number[];
				materialData[x] ??= [];

				for (let j = 1; j < zData.size(); j += 2) {
					const z = position.Y + zData[j];
					const material = zData[j + 1];
					materialData[x][z] = material;
				}
			}
		}
	}

	const generate = (x: number, z: number) => {
		const resolution = 3;
		const mult = 16 / resolution;
		x *= resolution;
		z *= resolution;

		const heights: number[][] = [];
		const startX = x;
		const endX = resolution + x;
		const startZ = z;
		const endZ = resolution + z;
		let minimumHeight = math.huge;
		let maximumHeight = -math.huge;
		for (let x = startX - 1 - 1; x < endX + 1; x++) {
			heights[x - startX - 1 - 1] = [];

			for (let z = startZ - 1 - 1; z < endZ + 1; z++) {
				const height = generateHeight(x * mult, z * mult);
				minimumHeight = math.min(height, minimumHeight);
				maximumHeight = math.max(height, maximumHeight);
				heights[x - startX - 1 - 1][z - startZ - 1 - 1] = height;
			}
		}

		return heights;
	};

	const loadedChunks: Record<number, Record<number, boolean>> = {};
	const createChunkLoader = () => {
		let radiusLoaded = 0;

		const loadChunksNextSingleRadius = (centerX: number, centerZ: number) => {
			const size = radiusLoaded++;

			for (let num = -size; num <= size; num++) {
				for (const [x, z] of [
					[num, -size],
					[-size, num],
					[num, size],
					[size, num],
				]) {
					const chunkX = centerX + x;
					const chunkZ = centerZ + z;

					if (loadedChunks[chunkX]?.[chunkZ]) continue;

					controller.generateTerrain(new Vector2(x, z), 0, generate(x, z));

					if (math.random(4) === 1) {
						task.wait();
					}
				}
			}
		};

		const tr = true;
		while (tr) {
			task.wait();
			if (!Workspace.CurrentCamera) continue;

			const pos = Workspace.CurrentCamera.Focus.Position;
			const chunkX = math.floor(pos.X / 4 / chunkSize);
			const chunkZ = math.floor(pos.Z / 4 / chunkSize);

			loadChunksNextSingleRadius(chunkX, chunkZ);
		}
	};

	if (false as boolean) {
		task.spawn(createChunkLoader);
	} else
		task.spawn(() => {
			task.wait(1);
			if (false as boolean) {
				for (let x = -20; x < 20; x++) {
					for (let z = -20; z < 20; z++) {
						controller.generateTerrain(new Vector2(x, z), 0, generate(x, z));
						task.wait();
					}
				}
			} else {
				controller.generateTerrain(new Vector2(0, 0), 0, generate(0, 0));
			}
		});
};

export const AutoTerrainGenerator = {
	initialize,
} as const;
