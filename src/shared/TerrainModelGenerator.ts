import { Workspace } from "@rbxts/services";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { TerrainDataInfo } from "shared/TerrainDataInfo";

type TerrainModel = Model & {
	readonly 1: BasePart;
	readonly 2: BasePart;
	readonly 3: BasePart;
	readonly 4: BasePart;
};
const models = ReplicatedAssets.get<{ TerrainGen: Readonly<Record<string, TerrainModel>> }>().TerrainGen;

const parent = new Instance("Folder", Workspace);
parent.Name = "SAMTerrain";

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
		const allModels: Model[] = [];
		if (ArraySizeY <= 1 || ArraySizeX <= 1) return;
		for (let y = 0; y < ArraySizeY - 1; y++) {
			for (let x = 0; x < ArraySizeX - 1; x++) {
				//const height = math.abs(this.heightMap[x][y]);
				//const halfHeight = height / 2;
				const posX = stepX * x;
				const posY = stepY * y;
				const model = models["TerrainTile"].Clone();
				const modelPos = model.GetPivot().Position;
				allModels.push(model);
				model.PivotTo(new CFrame(new Vector3(80, 5, 350)));
				//print("map:", this.heightMap);
				this.applyTriangle(model["1"], modelPos, this.heightMap[x][y], this.heightMap[x + 1][y]);
				this.applyTriangle(model["2"], modelPos, this.heightMap[x + 1][y + 1], this.heightMap[x + 1][y]);
				this.applyTriangle(model["3"], modelPos, this.heightMap[x][y + 1], this.heightMap[x + 1][y + 1]);
				this.applyTriangle(model["4"], modelPos, this.heightMap[x][y + 1], this.heightMap[x][y]);
				model.Parent = parent;
			}
		}
	}

	private applyTriangle(part: BasePart, Center: Vector3, height1: number, height2: number) {
		const helfHeight = (height1 + height2) / 2;
		const d = height2 > height1;
		//if (d) [height1, height2] = [height2, height1];
		const angle = math.atan(height1 / height2);
		const newAngle = d ? angle : -angle;
		part.Size = new Vector3(part.Size.X, part.Size.Y, part.Size.Z / angle);
		part.PivotTo(part.GetPivot().mul(CFrame.fromOrientation(0, newAngle, 0)));
		print("heights: ", height1, height2);
		print("angle: ", math.deg(newAngle));
	}
}

export class TerrainModelGenerator {
	private readonly ChunkMap: Map<Vector2, TerrainChunk> = new Map<Vector2, TerrainChunk>();
	private heightLimit = 0;
	readonly chunkSize: Vector3;
	readonly waterLevel = TerrainDataInfo.getData().waterHeight;

	constructor(chunkSize: Vector3) {
		this.chunkSize = chunkSize;
	}

	setMaxHeight(max: number) {
		this.heightLimit = max;
	}

	generateTerrainAtWorldPos(worldPos: Vector3, data: readonly (readonly number[])[]) {
		//todo
	}

	generateTerrain(pos: Vector2, chunkY: number, data: number[][]) {
		if (this.ChunkMap.has(pos)) return;
		const sizeWithHeightLimit =
			this.heightLimit !== 0 ? new Vector3(this.chunkSize.X, this.heightLimit, this.chunkSize.Z) : this.chunkSize;
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
