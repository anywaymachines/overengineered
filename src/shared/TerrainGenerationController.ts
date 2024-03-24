import { ReplicatedFirst, Workspace } from "@rbxts/services";
import TerrainDataInfo, { TerrainData, TerrainInfo } from "shared/TerrainDataInfo";

const parent = new Instance("Folder", Workspace);
parent.Name = "TEREIN wow";

class TerrainChunk {
	readonly chunkSize;
	readonly heightMap;

	constructor(ChunkPos: Vector2, chunkSize: Vector3, yOffset: number, noise: number[][]) {
		this.chunkSize = chunkSize;
		this.heightMap = noise;
		const pos = new Vector3(ChunkPos.X * chunkSize.X, yOffset, ChunkPos.Y * chunkSize.Z);
		const ArraySizeX = this.heightMap.size();
		const ArraySizeY = this.heightMap[0].size();
		const stepX = chunkSize.X / ArraySizeX;
		const stepY = chunkSize.Z / ArraySizeY;
		const halfSize = chunkSize.div(2);
		const basicSize = new Vector3(stepX / 2, 0, stepY / 2);

		let mainPart: Part | undefined;
		const allParts: Part[] = [];
		for (let y = 0; y < ArraySizeY; y++) {
			for (let x = 0; x < ArraySizeX; x++) {
				const height = math.abs(this.heightMap[x][y]);
				const halfHeight = height / 2;
				const posX = stepX * x;
				const posY = stepY * y;
				const p = new Instance("Part");
				p.Anchored = true;
				p.EnableFluidForces = false;
				p.Position = pos
					.add(new Vector3(posX, halfHeight, posY))
					.add(basicSize)
					.sub(halfSize);
				p.Size = new Vector3(stepX + 0.001, height + 0.001, stepY + 0.001);
				p.Parent = parent;

				if (mainPart) {
					allParts.push(p);
				} else {
					mainPart = p;
				}
			}
		}
		if (!mainPart) throw "what";

		if (false as boolean) {
			const union = mainPart.UnionAsync(allParts);
			allParts.forEach((v) => v.Destroy());
			union.Parent = parent;
		}
	}
}

export default class TerrainGenerator {
	static instance = new TerrainGenerator(new Vector2(256, 256));
	private ChunkMap: Map<Vector2, TerrainChunk> = new Map<Vector2, TerrainChunk>();
	private heightLimit = 0;
	readonly singleChunkSize: Vector2;
	readonly waterLevel = TerrainDataInfo.getData().waterHeight;

	constructor(chunkSize: Vector2) {
		this.singleChunkSize = chunkSize;
	}

	setMaxHeight(max: number) {
		this.heightLimit = max;
	}

	generateTerrainAtWorldPos(worldPos: Vector3, data: readonly (readonly number[])[]) {
		//todo
	}

	generateTerrain(chunkSize: Vector3, pos: Vector2, chunkY: number, data: number[][]) {
		if (this.ChunkMap.has(pos)) return;
		const sizeWithHeightLimit =
			this.heightLimit !== 0 ? new Vector3(chunkSize.X, this.heightLimit, chunkSize.Z) : chunkSize;
		const chunk = new TerrainChunk(pos, sizeWithHeightLimit, chunkY, data);
		this.ChunkMap.set(pos, chunk);
	}

	getChunkByWorldPos(worldPos: Vector3) {
		//todo
	}

	getChunk(pos: Vector2) {
		return this.ChunkMap.get(pos);
	}
}

const GetHeight = (x: number, z: number) => {
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
	const resolution = 4;
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
			const height = GetHeight(x * mult, z * mult);
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

				const size = new Vector3(16 * 4, 50, 16 * 4);
				TerrainGenerator.instance.generateTerrain(size, new Vector2(x, z), 0, generate(x, z));

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

if (true as boolean) {
	task.spawn(createChunkLoader);
} else
	task.spawn(() => {
		task.wait(1);
		const size = new Vector3(16 * 4, 50, 16 * 4);
		if (true as boolean) {
			for (let x = -20; x < 20; x++) {
				for (let z = -20; z < 20; z++) {
					TerrainGenerator.instance.generateTerrain(size, new Vector2(x, z), 0, generate(x, z));
					task.wait();
				}
			}
		} else {
			TerrainGenerator.instance.generateTerrain(size, new Vector2(0, 0), 0, generate(0, 0));
		}
	});
