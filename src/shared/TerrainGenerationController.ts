class TerrainChunk {
	readonly heightMap;

	constructor(Block: Part, noise: number[][]) {
		this.heightMap = noise;
		const sizeX = this.heightMap.size();
		const sizeY = this.heightMap[0].size();
		const stepX = Block.Size.X / sizeX;
		const stepY = Block.Size.Y / sizeY;
		for (let y = 0; y < sizeY; y++)
			for (let x = 0; x < sizeX; x++) {
				//
			}
	}
}

export default class TerrainGenerator {
	static instance = new TerrainGenerator(256, () => 1, 0);
	private ChunkMap: Map<Vector2, TerrainChunk> = new Map<Vector2, TerrainChunk>();
	private noiseFunction: Function;
	private heightLimit = 0;
	readonly waterLevel;
	readonly ChunkSize: number;

	constructor(chunkSize: number, noiseGeneration: Function, waterLevel?: number) {
		this.waterLevel = waterLevel ?? 0;
		this.ChunkSize = chunkSize;
		this.noiseFunction = noiseGeneration;
	}

	generateHeightMap(): number[][] {
		return this.noiseFunction();
	}

	setMaxHeight(max: number) {
		this.heightLimit = max;
	}

	generateTerrainAtWorldPos(worldPos: Vector3) {
		//todo
	}

	generateTerrain(pos: Vector2) {
		if (this.ChunkMap.has(pos)) return;

		const part = new Instance("Part");
		part.CastShadow = false;
		part.Anchored = true;
		// part.Color =
		// part.Size
		// part.CFrame
		// part.Material

		const chunk = new TerrainChunk(part, this.generateHeightMap());
		this.ChunkMap.set(pos, chunk);
	}

	getChunkByWorldPos(worldPos: Vector3) {
		//todo
	}

	getChunk(pos: Vector2) {
		return this.ChunkMap.get(pos);
	}
}
