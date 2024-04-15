import { Players, RunService, UserInputService } from "@rbxts/services";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import { ChunkLoader, ChunkRenderer } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { rootComponents } from "client/test/RootComponents";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { GameDefinitions } from "shared/data/GameDefinitions";

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

if ((false as boolean) && (RunService.IsStudio() || GameDefinitions.isAdmin(Players.LocalPlayer))) {
	const tooltips = TooltipsHolder.createComponent("Terrain");
	tooltips.set({
		Desktop: [
			{ keys: ["KeypadZero"], text: "Turn off the chunk renderer" },
			{ keys: ["KeypadOne"], text: "Triangle chunk renderer" },
			{ keys: ["KeypadTwo"], text: "Terrain chunk renderer" },
			{ keys: ["KeypadThree"], text: "Flat chunk renderer" },
			{ keys: ["KeypadFour"], text: "Multi chunk renderer" },
		],
	});
	tooltips.enable();

	let current: ChunkLoader | undefined;
	UserInputService.InputBegan.Connect((input) => {
		let chunkLoader: ChunkLoader | undefined;

		if (input.KeyCode === Enum.KeyCode.KeypadZero) {
			chunkLoader = undefined;
		} else if (input.KeyCode === Enum.KeyCode.KeypadOne) {
			chunkLoader = new ChunkLoader(TriangleChunkRenderer(DefaultChunkGenerator));
		} else if (input.KeyCode === Enum.KeyCode.KeypadTwo) {
			chunkLoader = new ChunkLoader(TerrainChunkRenderer(DefaultChunkGenerator));
		} else if (input.KeyCode === Enum.KeyCode.KeypadThree) {
			chunkLoader = new ChunkLoader(FlatTerrainRenderer(0.5 - 0.01));
		} else if (input.KeyCode === Enum.KeyCode.KeypadFour) {
			chunkLoader = new ChunkLoader(multirender());
		} else return;

		if (current) {
			rootComponents.remove(rootComponents.indexOf(current));
			current?.destroy();
		}

		current = chunkLoader;

		if (chunkLoader) {
			chunkLoader.enable();
			rootComponents.push(chunkLoader);
		}
	});
} else {
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
}
