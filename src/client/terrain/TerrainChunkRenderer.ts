import { ReplicatedFirst, Workspace } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { ChunkGenerator, ChunkRenderer } from "client/terrain/ChunkLoader";
import type { InfiniteTerrainActor } from "client/terrain/InfiniteTerrainActor";

if (GameDefinitions.APRIL_FOOLS) {
	Workspace.Terrain.SetMaterialColor(Enum.Material.Basalt, new Color3(0.4, 0.2, 0.2));
}

type config = {
	readonly snowOnly: boolean;
};
export const TerrainChunkRenderer = (
	generator: ChunkGenerator,
	foliage: boolean,
	config?: config,
): ChunkRenderer<true> => {
	const chunkSize = 16;
	const actorAmount = 8;

	const folder = new Instance("Folder", ReplicatedFirst);
	const actors: InfiniteTerrainActor[] = [];
	let selectedActor = 0;

	const clearActors = () => {
		for (const actor of folder.GetChildren()) {
			if (actor.IsA("Actor")) {
				actor.Destroy();
			}
		}
		actors.clear();
	};
	const recreateActors = () => {
		clearActors();

		for (let i = 1; i < actorAmount; i++) {
			const actor = new Instance("Actor");
			actor.Parent = folder;

			const actorScript = (script.Parent!.WaitForChild("InfiniteTerrainActor") as ModuleScript).Clone();
			actorScript.Parent = actor;

			const tactor = (require(actorScript) as { default: InfiniteTerrainActor }).default;
			tactor.initialize(chunkSize, generator);
			tactor.Loaded.Event.Connect(() => actorSemaphore.release());
			actors.push(tactor);
		}
	};
	recreateActors();

	const createSemaphore = (maxCount: number) => {
		const queue: Callback[] = [];
		let currentCount = maxCount;

		const q = {
			wait: () => {
				if (currentCount > 0) {
					currentCount--;
					return;
				}

				let completed = false;
				const resolver = () => (completed = true);
				queue.push(resolver);

				while (!completed) {
					task.wait();
				}
			},
			release: () => {
				if (queue.size() === 0) {
					if (currentCount > maxCount) throw "Trying to release beyond the maximum.";
					currentCount++;
					return;
				}

				queue.remove(0)?.();
			},
		};

		return q;
	};

	const actorSemaphore = createSemaphore(actorAmount);
	const findAvailableActor = () => {
		const actor = actors[++selectedActor];
		if (actor) return actor;

		return actors[(selectedActor = 0)];
	};

	return {
		chunkSize: chunkSize * 4,

		renderChunk(chunkX: number, chunkZ: number): true {
			actorSemaphore.wait();
			findAvailableActor().Load.Fire(chunkX, chunkZ, foliage, config);

			return true;
		},
		destroyChunk(chunkX: number, chunkZ: number): void {
			findAvailableActor().Unload.Fire(chunkX, chunkZ);
		},
		unloadAll(chunks) {
			clearActors();
			Workspace.Terrain.Clear();
			Workspace.Terrain.ClearAllChildren();
		},
		destroy() {
			clearActors();
		},
	};
};
