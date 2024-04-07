import { Workspace } from "@rbxts/services";
import { Element } from "shared/Element";

const parent = Element.create("Folder", { Name: "TEREIN", Parent: Workspace });

export class FlatTerrainGenerator {
	private tileSize = new Vector2(128, 128);
	private tileInstance;
	private height = 0;
	private renderDistance = 128;
	private generatedTilesList: Part[] = [];

	constructor(tileSize?: Vector2, renderDistance?: number, material?: Enum.Material, heightOffset?: number) {
		if (tileSize) this.tileSize = tileSize;
		if (heightOffset) this.height = heightOffset;
		this.tileInstance = new Instance("Part");
		this.tileInstance.Anchored = true;
		this.tileInstance.Size = new Vector3(this.tileSize.X, 1, this.tileSize.Y);
		if (material !== undefined) this.tileInstance.Material = material;
	}

	private placeTile(position: Vector3) {
		const inst = this.tileInstance.Clone(); //copy
		inst.Position = position;
		this.generatedTilesList.push(inst);
		inst.Parent = parent;
	}

	render(worldPosition: Vector3) {
		this.unloadRendered(); //optimize this shit <---------------------------------------------------------
		const start = this.convertToTilePos(worldPosition);
		const endp = start.add(new Vector2(this.renderDistance, this.renderDistance));
		for (let x = start.X; x < endp.X; x++)
			for (let y = start.Y; y < endp.Y; y++) {
				const p = this.convertFromTileToWorldPos(new Vector2(x, y));
				this.placeTile(p);
			}
	}
	setRenderDistance(distance: number) {
		this.renderDistance = distance;
	}

	unloadRendered() {
		while (this.generatedTilesList.size()) this.generatedTilesList.pop()?.Destroy();
	}

	private convertToTilePos(position: Vector3) {
		const base = new Vector3(this.tileSize.X, 1, this.tileSize.Y); //set size value
		const pos = position
			.div(base) //"normaize" coordinates
			.Floor(); //floor the pos
		return new Vector2(pos.X, pos.Z);
	}

	private convertFromTileToWorldPos(position: Vector2) {
		const base = new Vector3(this.tileSize.X, 1, this.tileSize.Y); //set size value
		const pos = new Vector3(position.X, this.height, position.Y).mul(base).add(base.div(2)); //add size offset
		return pos;
	}

	private roundToTilePos(position: Vector3) {
		return this.convertFromTileToWorldPos(this.convertToTilePos(position));
	}
}

/* DO NOT DELETE MIGHT PROVE TO BE USEFUL

const loadDistance = 20;
const loadDistancePow = math.pow(loadDistance, 2);

const loadedChunks: Record<number, Record<number, boolean>> = {};

// terrain hides if player is higher than this value
const maxVisibleHeight = 1500;

const shouldBeLoaded = (chunkX: number, chunkZ: number, centerX: number, centerZ: number) => {
	if (math.pow(chunkX - centerX, 2) + math.pow(chunkZ - centerZ, 2) > loadDistancePow) {
		return false;
	}

	return true;
};

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
				if (!shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) continue;

				LoadChunk(chunkX, chunkZ);
			}
		}
	};

	let prevPosX = math.huge;
	let prevPosZ = math.huge;

	const tr = true;
	let c = os.clock() as number | undefined;
	while (tr) {
		task.wait();
		if (!Workspace.CurrentCamera) continue;

		if (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer)) {
			for (const [x, c] of Objects.pairs_(loadedChunks)) {
				for (const [y] of Objects.pairs_(c)) {
					UnloadChunk(x, y);
				}
				task.wait();
			}

			do {
				task.wait();
			} while (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer));

			continue;
		}

		let pos = Workspace.CurrentCamera?.Focus?.Position ?? Vector3.zero;
		if (pos.X !== pos.X || pos.Y !== pos.Y || pos.Z !== pos.Z) {
			// nan
			pos = Vector3.zero;
		}

		const chunkX = math.floor(pos.X / 4 / chunkSize);
		const chunkZ = math.floor(pos.Z / 4 / chunkSize);

		if (prevPosX !== chunkX || prevPosZ !== chunkZ) {
			UnloadChunks(chunkX, chunkZ);
			radiusLoaded = 0;

			prevPosX = chunkX;
			prevPosZ = chunkZ;
		}

		if (radiusLoaded < loadDistance) {
			loadChunksNextSingleRadius(chunkX, chunkZ);
			continue;
		} else if (c !== undefined) {
			print(os.clock() - c);
			c = undefined;
		}
	}
};
*/
