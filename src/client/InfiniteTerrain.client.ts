import { Players, ReplicatedFirst, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import Objects from "shared/_fixes_/objects";
import PlayerUtils from "shared/utils/PlayerUtils";
import PlayerDataStorage from "./PlayerDataStorage";

if (!game.IsLoaded()) {
	game.Loaded.Wait();
}

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

let work = true;

const folder = ReplicatedFirst.WaitForChild("Terrain") as Folder & {
	Actor: TerrainActor;
	Configuration: {
		ActorAmount: IntValue;
		ChunkSize: IntValue;
		LoadDistance: IntValue;
		UnloadDistance: IntValue;
	};
};

type TerrainActor = {
	Load: Signal<(chunkX: number, chunkZ: number) => void>;
	Unload: Signal<(chunkX: number, chunkZ: number) => void>;
};

const actorAmount = folder.Configuration.ActorAmount.Value;
const chunkSize = folder.Configuration.ChunkSize.Value;
const loadDistance = folder.Configuration.LoadDistance.Value;
const unloadDistance = folder.Configuration.UnloadDistance.Value;
const chunkAmount = math.pow(folder.Configuration.LoadDistance.Value * 2 + 1, 2);
const moveDistance = math.pow(chunkSize * 4, 2);

const actors: TerrainActor[] = [];
let loadedChunks: Record<number, Record<number, boolean>> = {};

let positionX = math.huge;
let positionZ = math.huge;
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

		actors.push((require(actorScript) as { default: TerrainActor }).default);
	}
};
recreateActors();

const findAvailableActor = () => {
	const actor = actors[++selectedActor];
	if (actor) return actor;

	task.wait();
	return actors[(selectedActor = 0)];
};

const LoadChunk = (chunkX: number, chunkZ: number) => {
	loadedChunks[chunkX] ??= [];
	if (loadedChunks[chunkX][chunkZ]) {
		return;
	}

	loadedChunks[chunkX][chunkZ] = true;
	findAvailableActor().Load.Fire(chunkX, chunkZ);
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

	if (new Vector2(chunkX - centerX, chunkZ - centerZ).Magnitude > loadDistance) {
		return false;
	}
	if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
		return false;
	}

	return true;
};

const LoadChunks = (centerX: number, centerZ: number) => {
	let chunkX = centerX;
	let chunkZ = centerZ;
	let directionX = 1;
	let directionZ = 0;
	let count = 0;
	let length = 1;

	LoadChunk(chunkX, chunkZ);

	for (let i = 0; i < chunkAmount; i++) {
		chunkX += directionX;
		chunkZ += directionZ;
		count++;
		if (count === length) {
			count = 0;
			[directionX, directionZ] = [-directionZ, directionX];
			if (directionZ === 0) {
				length++;
			}
		}

		if (!shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) continue;
		LoadChunk(chunkX, chunkZ);
	}
};

const UnloadChunks = (centerX: number, centerZ: number) => {
	for (const [chunkX, data] of Objects.entries(loadedChunks)) {
		for (const chunkZ of Objects.keys(data)) {
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

let terra: LocalScript | undefined;
PlayerDataStorage.config.createNullableChild("betaTerrain", undefined).subscribe((enabled) => {
	unloadWholeTerrain();
	terra?.Destroy();
	work = enabled === true;

	if (!enabled) {
		terra = terrainsrc.Clone();
		terra.Parent = terrainsrc.Parent;
		terra.Enabled = true;
	} else {
		positionX = math.huge;
		positionZ = math.huge;
	}
}, true);
//

const tru = true;
while (tru) {
	while (!work) {
		task.wait();
	}

	task.wait();
	if (!Workspace.CurrentCamera) continue;

	if (isTooHigh()) {
		unloadWholeTerrain();

		do {
			task.wait();
		} while (isTooHigh());

		positionX = math.huge;
		positionZ = math.huge;
		continue;
	}

	const focusX = Workspace.CurrentCamera.Focus.Position.X;
	const focusZ = Workspace.CurrentCamera.Focus.Position.Z;
	if (
		PlayerUtils.isAlive(Players.LocalPlayer) &&
		math.pow(positionX - focusX, 2) + math.pow(positionZ - focusZ, 2) < moveDistance
	) {
		continue;
	}

	positionX = focusX;
	positionZ = focusZ;
	const chunkX = math.floor(positionX / 4 / chunkSize);
	const chunkZ = math.floor(positionZ / 4 / chunkSize);

	LoadChunks(chunkX, chunkZ);
	if (unloadDistance >= loadDistance) {
		UnloadChunks(chunkX, chunkZ);
	}
}
