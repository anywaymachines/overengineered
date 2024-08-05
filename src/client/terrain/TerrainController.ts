import { ChunkLoader } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { WaterTerrainChunkRenderer } from "client/terrain/WaterTerrainChunkRenderer";
import { ComponentChildren } from "shared/component/ComponentChildren";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class TerrainController extends HostedService {
	constructor(@inject playerData: PlayerDataStorage) {
		super();

		const loaders = new ComponentChildren<ChunkLoader>(this, true);
		const terrain = playerData.config.createBased((c) => c.terrain);

		this.event.subscribeObservable(
			terrain,
			(terrain) => {
				loaders.clear();

				switch (terrain.kind) {
					case "Triangle":
						loaders.add(
							new ChunkLoader(
								TriangleChunkRenderer(DefaultChunkGenerator, terrain.resolution),
								terrain.loadDistance,
							),
						);

						if (terrain.water) {
							loaders.add(new ChunkLoader(WaterTerrainChunkRenderer(), terrain.loadDistance * 2));
						}

						break;
					case "Classic":
						loaders.add(
							new ChunkLoader(
								TerrainChunkRenderer(DefaultChunkGenerator, terrain.foliage),
								terrain.loadDistance,
							),
						);
						break;
					case "Flat":
						loaders.add(new ChunkLoader(FlatTerrainRenderer(0.5 - 0.01), terrain.loadDistance));
						break;
					case "Water":
						loaders.add(new ChunkLoader(WaterTerrainChunkRenderer(), terrain.loadDistance));
						break;
				}
			},
			true,
		);
	}
}
