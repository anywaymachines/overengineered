import { Workspace } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { Component } from "shared/component/Component";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Objects } from "shared/fixes/objects";

/** Generates terrain height */
export interface ChunkGenerator {
	getHeight(x: number, z: number): number;
}

/** Generates terrain height */
export interface ChunkRenderer<T = defined> {
	readonly chunkSize: number;
	readonly loadDistanceMultiplier?: number;

	renderChunk(chunkX: number, chunkZ: number): T;
	destroyChunk(chunkX: number, chunkZ: number, chunk: T): void;
	unloadAll(chunks: readonly T[]): void;
	destroy(): void;
}

/** Controls chunk loading and unloading in relation to the player position */
export class ChunkLoader<T = defined> extends Component {
	private loadedChunks: Record<number, Record<number, { chunk?: T }>> = {};
	private radiusLoaded = 0;

	private readonly loadDistance;
	private readonly loadDistancePow;
	private readonly maxVisibleHeight = 3000 + GameDefinitions.HEIGHT_OFFSET;

	constructor(private readonly chunkRenderer: ChunkRenderer<T>) {
		super();

		this.loadDistance =
			(PlayerDataStorage.config.get().terrain.loadDistance / chunkRenderer.chunkSize) *
			(16 * 4) *
			(chunkRenderer.loadDistanceMultiplier ?? 1);
		this.loadDistancePow = math.pow(this.loadDistance, 2);

		task.spawn(() => this.createChunkLoader());
		this.onDisable(() => {
			chunkRenderer.unloadAll(
				Objects.values(this.loadedChunks)
					.flatmap(Objects.values)
					.filter((c) => c.chunk !== undefined)
					.map((c) => c.chunk!),
			);

			this.loadedChunks = {};
		});
		this.onDestroy(() => chunkRenderer.destroy());
	}

	private createChunkLoader() {
		if (!game.IsLoaded()) {
			game.Loaded.Wait();
		}

		let prevPosX = math.huge;
		let prevPosZ = math.huge;

		let c = os.clock() as number | undefined;
		while (true as boolean) {
			task.wait();
			if (this.isDestroyed()) return;
			if (!this.isEnabled()) continue;
			if (!Workspace.CurrentCamera) continue;

			if (this.isTooHigh()) {
				for (const [x, c] of Objects.pairs_(this.loadedChunks)) {
					for (const [y] of Objects.pairs_(c)) {
						this.unloadChunk(x, y);
					}

					task.wait();
				}

				do {
					task.wait();
				} while (this.isTooHigh());

				continue;
			}

			let pos = Workspace.CurrentCamera?.Focus?.Position ?? Vector3.zero;
			if (pos.X !== pos.X || pos.Y !== pos.Y || pos.Z !== pos.Z) {
				// nan
				pos = Vector3.zero;
			}

			const chunkX = math.floor(pos.X / this.chunkRenderer.chunkSize);
			const chunkZ = math.floor(pos.Z / this.chunkRenderer.chunkSize);

			if (prevPosX !== chunkX || prevPosZ !== chunkZ) {
				this.unloadChunks(chunkX, chunkZ);
				this.radiusLoaded = 0;

				prevPosX = chunkX;
				prevPosZ = chunkZ;
			}

			if (this.radiusLoaded < this.loadDistance) {
				this.loadChunksNextSingleRadius(chunkX, chunkZ);
				continue;
			} else if (c !== undefined) {
				// print(os.clock() - c);
				c = undefined;
			}
		}
	}

	private generateChunk(chunkX: number, chunkZ: number) {
		return this.chunkRenderer.renderChunk(chunkX, chunkZ);
	}

	private loadChunk(chunkX: number, chunkZ: number) {
		if (this.loadedChunks[chunkX]?.[chunkZ]) {
			return;
		}

		(this.loadedChunks[chunkX] ??= {})[chunkZ] = {};
		this.loadedChunks[chunkX][chunkZ].chunk = this.generateChunk(chunkX, chunkZ);
	}
	private unloadChunk(chunkX: number, chunkZ: number) {
		if (!this.loadedChunks[chunkX]?.[chunkZ]) {
			return;
		}

		const chunk = this.loadedChunks[chunkX][chunkZ].chunk;

		delete this.loadedChunks[chunkX][chunkZ];
		if (Objects.size(this.loadedChunks[chunkX]) === 0) {
			delete this.loadedChunks[chunkX];
		}

		if (chunk !== undefined) {
			this.chunkRenderer.destroyChunk(chunkX, chunkZ, chunk);
		}
	}

	private shouldBeLoaded(chunkX: number, chunkZ: number, centerX: number, centerZ: number) {
		if (math.pow(chunkX - centerX, 2) + math.pow(chunkZ - centerZ, 2) > this.loadDistancePow) {
			return false;
		}

		return true;
	}
	private isTooHigh() {
		return Workspace.CurrentCamera && Workspace.CurrentCamera.Focus.Position.Y >= this.maxVisibleHeight;
	}

	private unloadChunks(centerX: number, centerZ: number) {
		for (const [chunkX, data] of Objects.pairs_(this.loadedChunks)) {
			for (const [chunkZ, _] of Objects.pairs_(data)) {
				if (this.loadedChunks[chunkX]?.[chunkZ] && this.loadedChunks[chunkX][chunkZ].chunk === undefined) {
					continue;
				}
				if (this.shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) {
					continue;
				}

				this.unloadChunk(chunkX, chunkZ);
			}
		}
	}

	private loadChunksNextSingleRadius(centerX: number, centerZ: number) {
		const size = this.radiusLoaded++;

		for (let num = -size; num <= size; num++) {
			for (const [x, z] of [
				[num, -size],
				[-size, num],
				[num, size],
				[size, num],
			]) {
				const chunkX = centerX + x;
				const chunkZ = centerZ + z;

				if (this.loadedChunks[chunkX]?.[chunkZ]) continue;
				if (!this.shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) continue;

				this.loadChunk(chunkX, chunkZ);
			}
		}
	}
}
