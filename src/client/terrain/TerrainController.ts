import { ChunkLoader } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { WaterTerrainChunkRenderer } from "client/terrain/WaterTerrainChunkRenderer";
import { rootComponents } from "client/test/RootComponents";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStoragee } from "client/PlayerDataStorage";
import type { ChunkRenderer } from "client/terrain/ChunkLoader";

const multirender = (): ChunkRenderer<Instance> => {
	const terracr = TriangleChunkRenderer(DefaultChunkGenerator);
	const flatcr = FlatTerrainRenderer(0.5 - 0.01, terracr.chunkSize);

	return {
		chunkSize: terracr.chunkSize,
		// loadDistanceMultiplier: flatcr.loadDistanceMultiplier,

		renderChunk(chunkX, chunkZ) {
			if (math.abs(chunkX) < 10 && math.abs(chunkZ) < 10) {
				return terracr.renderChunk(chunkX, chunkZ);
			}

			return flatcr.renderChunk(chunkX, chunkZ);
		},
		destroyChunk(chunkX, chunkZ, chunk) {
			if (math.abs(chunkX) < 10 && math.abs(chunkZ) < 10) {
				return terracr.destroyChunk(chunkX, chunkZ, chunk as never);
			}

			return flatcr.destroyChunk(chunkX, chunkZ, chunk as never);
		},
		unloadAll(chunks) {
			for (const chunk of chunks) {
				chunk.Destroy();
			}
		},
		destroy() {
			terracr.destroy();
			flatcr.destroy();
		},
	};
};

@injectable
export class TerrainController extends HostedService {
	constructor(@inject playerData: PlayerDataStoragee) {
		super();

		let current: ChunkLoader | undefined;
		const terrain = playerData.config.createBased((c) => c.terrain);

		this.event.subscribeObservable(
			terrain,
			(terrain) => {
				let chunkLoader: ChunkLoader | undefined;

				switch (terrain.kind) {
					case "Triangle":
						chunkLoader = new ChunkLoader(
							TriangleChunkRenderer(DefaultChunkGenerator, terrain.resolution),
							terrain.loadDistance,
						);
						break;
					case "Terrain":
						chunkLoader = new ChunkLoader(
							TerrainChunkRenderer(DefaultChunkGenerator, terrain.foliage),
							terrain.loadDistance,
						);
						break;
					case "Flat":
						chunkLoader = new ChunkLoader(FlatTerrainRenderer(0.5 - 0.01), terrain.loadDistance);
						break;
					case "Water":
						chunkLoader = new ChunkLoader(WaterTerrainChunkRenderer(), terrain.loadDistance);
						break;
				}

				if (current) {
					rootComponents.remove(rootComponents.indexOf(current));
					current?.destroy();
				}

				current = chunkLoader;

				if (chunkLoader) {
					chunkLoader.enable();
					rootComponents.push(chunkLoader);
				}
			},
			true,
		);
	}
}
