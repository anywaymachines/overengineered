import { GameLoader } from "client/GameLoader";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { ChunkLoader } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { WaterTerrainChunkRenderer } from "client/terrain/WaterTerrainChunkRenderer";
import { rootComponents } from "client/test/RootComponents";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type { ChunkRenderer } from "client/terrain/ChunkLoader";

GameLoader.waitForEverything();

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

	switch (terrain.kind) {
		case "Triangle":
			chunkLoader = new ChunkLoader(TriangleChunkRenderer(DefaultChunkGenerator, terrain.resolution));
			break;
		case "Terrain":
			chunkLoader = new ChunkLoader(TerrainChunkRenderer(DefaultChunkGenerator));
			break;
		case "Flat":
			chunkLoader = new ChunkLoader(FlatTerrainRenderer(0.5 - 0.01));
			break;
		case "Water":
			chunkLoader = new ChunkLoader(WaterTerrainChunkRenderer());
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
}, true);
