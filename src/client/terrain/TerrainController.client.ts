import { PlayerDataStorage } from "client/PlayerDataStorage";
import { ChunkLoader, ChunkRenderer } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { rootComponents } from "client/test/RootComponents";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

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

let current: ChunkLoader | undefined;
const terrain = PlayerDataStorage.config.createChild("terrain", PlayerConfigDefinition.terrain.config);

terrain.subscribe((terrain) => {
	let chunkLoader: ChunkLoader | undefined;
	if (terrain.kind === "Triangle") {
		chunkLoader = new ChunkLoader(TriangleChunkRenderer(DefaultChunkGenerator, terrain.resolution));
	} else if (terrain.kind === "Terrain") {
		chunkLoader = new ChunkLoader(TerrainChunkRenderer(DefaultChunkGenerator));
	} else if (terrain.kind === "Flat") {
		chunkLoader = new ChunkLoader(FlatTerrainRenderer(0.5 - 0.01));
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
}, true);
