import { Players, ReplicatedFirst, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import TerrainDataInfo from "shared/TerrainDataInfo";
import Objects from "shared/fixes/objects";
import PlayerUtils from "shared/utils/PlayerUtils";
import PlayerDataStorage from "./PlayerDataStorage";

if (!game.IsLoaded()) {
	game.Loaded.Wait();
}

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

const work = true;

const folder = TerrainDataInfo.getInfo();

type TerrainActor = {
	Load: Signal<(chunkX: number, chunkZ: number, loadFoliage: boolean) => void>;
	Unload: Signal<(chunkX: number, chunkZ: number) => void>;
	Loaded: Signal<(chunkX: number, chunkZ: number) => void>;
};

const actorAmount = folder.Configuration.ActorAmount.Value;
const chunkSize = folder.Configuration.ChunkSize.Value;
const loadDistance = folder.Configuration.LoadDistance.Value;
const loadDistancePow = math.pow(folder.Configuration.LoadDistance.Value, 2);
const unloadDistance = folder.Configuration.UnloadDistance.Value;
const chunkAmount = math.pow(folder.Configuration.LoadDistance.Value * 2 + 1, 2);
const moveDistance = math.pow(chunkSize * 4, 2);

const actors: TerrainActor[] = [];
let loadedChunks: Record<number, Record<number, boolean>> = {};

let selectedActor = 0;

const recreateActors = () => {
	for (const actor of folder.GetChildren()) {
		if (actor.IsA("Actor")) {
			actor.Destroy();
		}
	}
	actors.clear();

	for (let i = 1; i < actorAmount; i++) {
		const actor = new Instance("Actor");
		actor.Parent = folder;

		const actorScript = (script.Parent!.WaitForChild("InfiniteTerrainActor") as ModuleScript).Clone();
		actorScript.Parent = actor;

		const tactor = (require(actorScript) as { default: TerrainActor }).default;
		tactor.Loaded.Connect(() => actorSemaphore.release());
		tactor.Loaded.Connect((chunkX, chunkZ) => {
			const load = false;
			if (!load) return;

			const name = chunkX + "," + chunkZ;

			const heightData = ReplicatedFirst.WaitForChild("Terrain").WaitForChild("Data").WaitForChild("HeightData");
			heightData.FindFirstChild(name)?.Destroy();

			const data = new Instance("ModuleScript") as ModuleScript & { Source: string };
			data.Source = "asd";
			data.Parent = heightData;
		});
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

const LoadChunk = (chunkX: number, chunkZ: number) => {
	loadedChunks[chunkX] ??= [];
	if (loadedChunks[chunkX][chunkZ]) {
		return;
	}

	loadedChunks[chunkX][chunkZ] = true;

	actorSemaphore.wait();
	findAvailableActor().Load.Fire(chunkX, chunkZ, PlayerDataStorage.config.get().terrainFoliage);
};

const UnloadChunk = (chunkX: number, chunkZ: number) => {
	if (!loadedChunks[chunkX]?.[chunkZ]) {
		return;
	}

	delete loadedChunks[chunkX][chunkZ];
	if (Objects.keys(loadedChunks[chunkX]).size() === 0) {
		delete loadedChunks[chunkX];
	}

	findAvailableActor().Unload.Fire(chunkX, chunkZ);
};

const shouldBeLoaded = (chunkX: number, chunkZ: number, centerX: number, centerZ: number) => {
	const alwaysLoad = false;
	if (alwaysLoad) return true;

	if (math.pow(chunkX - centerX, 2) + math.pow(chunkZ - centerZ, 2) > loadDistancePow) {
		return false;
	}

	return true;
};

const UnloadChunks = (centerX: number, centerZ: number) => {
	for (const [chunkX, data] of Objects.pairs(loadedChunks)) {
		for (const [chunkZ, _] of Objects.pairs(data)) {
			if (shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) continue;
			UnloadChunk(chunkX, chunkZ);
		}
	}
};

// terrain hides if player is higher than this value
const maxVisibleHeight = 1500;

const isTooHigh = () => {
	return Workspace.CurrentCamera && Workspace.CurrentCamera.Focus.Position.Y >= maxVisibleHeight;
};
const unloadWholeTerrain = () => {
	loadedChunks = {};
	recreateActors();

	(Workspace.WaitForChild("Terrain") as Terrain).Clear();
	(Workspace.WaitForChild("Terrain") as Terrain).ClearAllChildren();
};

// init
const terrainsrc = ReplicatedFirst.WaitForChild("Terrain").WaitForChild("Terrain") as LocalScript;
terrainsrc.Enabled = false;

const createChunkLoader = () => {
	print("Initializing chunk LOAD er");
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
	while (tr) {
		task.wait();
		if (!Workspace.CurrentCamera) continue;

		if (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer)) {
			unloadWholeTerrain();

			do {
				task.wait();
			} while (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer));

			continue;
		}

		const pos = Workspace.CurrentCamera.Focus.Position;
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
		}
	}
};

const betaChunkLoader = () => {
	const loadChunksAround = (centerX: number, centerZ: number) => {
		for (let size = 0; size < loadDistance; size++) {
			let alreadyLoaded = true;

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

					alreadyLoaded = false;
					LoadChunk(chunkX, chunkZ);
				}
			}

			if (!alreadyLoaded) {
				return true;
			}
		}

		return false;
	};

	let positionX = math.huge;
	let positionZ = math.huge;

	const tru = true;
	while (tru) {
		while (!work) {
			task.wait();
		}

		task.wait();
		if (!Workspace.CurrentCamera) continue;

		if (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer)) {
			unloadWholeTerrain();

			do {
				task.wait();
			} while (isTooHigh() || !PlayerUtils.isAlive(Players.LocalPlayer));

			continue;
		}

		const focusX = Workspace.CurrentCamera.Focus.Position.X;
		const focusZ = Workspace.CurrentCamera.Focus.Position.Z;

		positionX = focusX;
		positionZ = focusZ;
		const chunkX = math.floor(positionX / 4 / chunkSize);
		const chunkZ = math.floor(positionZ / 4 / chunkSize);

		loadChunksAround(chunkX, chunkZ);

		if (
			math.pow(positionX - focusX, 2) + math.pow(positionZ - focusZ, 2) < moveDistance &&
			unloadDistance >= loadDistance
		) {
			UnloadChunks(chunkX, chunkZ);
		}
	}
};

//if (Players.LocalPlayer.Name === "i3ymm") {
createChunkLoader();
throw "ded";
//}

betaChunkLoader();
