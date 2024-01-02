import { Players, ReplicatedFirst, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import PlayerDataStorage from "./PlayerDataStorage";

if (!game.IsLoaded()) {
	game.Loaded.Wait();
}

while (!PlayerDataStorage.data.get()) {
	task.wait();
}

let work = true;

const terrainsrc = ReplicatedFirst.WaitForChild("Terrain").WaitForChild("Terrain") as LocalScript;
terrainsrc.Enabled = false;

let terra: LocalScript | undefined;

PlayerDataStorage.config.subscribe((cfg) => {
	(Workspace.WaitForChild("Terrain") as Terrain).Clear();
	(Workspace.WaitForChild("Terrain") as Terrain).ClearAllChildren();
	terra?.Destroy();
	work = cfg.betaTerrain;

	if (!cfg.betaTerrain) {
		terra = terrainsrc.Clone();
		terra.Parent = terrainsrc.Parent;
		terra.Enabled = true;
	}
}, true);

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
const loadedChunks: boolean[][] = [];

let positionX = math.huge;
let positionZ = math.huge;
let selectedActor = 0;
let first = true;

for (let i = 2; i < actorAmount; i++) {
	const actor = new Instance("Actor") as Actor;
	actor.Parent = folder;

	const actorScript = (script.Parent!.WaitForChild("InfiniteTerrainActor") as ModuleScript).Clone();
	actorScript.Parent = actor;

	actors.push((require(actorScript) as { default: TerrainActor }).default);
}
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
	findAvailableActor().Unload.Fire(chunkX, chunkZ);

	if (!loadedChunks[chunkX]) return;

	delete loadedChunks[chunkX][chunkZ];
	if (loadedChunks[chunkX].size() === 0) {
		delete loadedChunks[chunkX];
	}
};

const isAlive = () => {
	const v = Players.LocalPlayer;
	return (
		v &&
		v.Character &&
		v.Character.Parent &&
		v.Character.FindFirstChild("Humanoid") &&
		(v.Character.FindFirstChild("Humanoid") as Humanoid).Health > 0
	);
};

const shouldBeLoaded = (chunkX: number, chunkZ: number, centerX: number, centerZ: number) => {
	const tr = false;
	if (tr) return true;

	if (new Vector2(chunkX - centerX, chunkZ - centerZ).Magnitude > loadDistance) {
		return false;
	}
	if (Workspace.CurrentCamera && Workspace.CurrentCamera.Focus.Position.Y >= 1500) {
		return false;
	}
	if (!isAlive()) {
		return false;
	}

	return true;
};

const LoadChunks = (centerX: number, centerZ: number, start: number | undefined) => {
	let chunkX = centerX;
	let chunkZ = centerZ;
	let directionX = 1;
	let directionZ = 0;
	let count = 0;
	let length = 1;

	if (first) {
		first = false;
		LoadChunk(chunkX, chunkZ);
	}

	start ??= 2;

	for (let i = start; i < chunkAmount; i++) {
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
	loadedChunks.forEach((data, chunkX) => {
		data.forEach((value, chunkZ) => {
			if (shouldBeLoaded(chunkX, chunkZ, centerX, centerZ)) return;
			UnloadChunk(chunkX, chunkZ);
		});
	});
};

const tru = true;
while (tru) {
	while (!work) {
		loadedChunks.clear();
		task.wait();
	}

	task.wait();
	if (!Workspace.CurrentCamera) continue;

	const focusX = Workspace.CurrentCamera.Focus.Position.X;
	const focusZ = Workspace.CurrentCamera.Focus.Position.Z;
	if (isAlive() && math.pow(positionX - focusX, 2) + math.pow(positionZ - focusZ, 2) < moveDistance) {
		continue;
	}

	positionX = focusX;
	positionZ = focusZ;
	const chunkX = math.floor(positionX / 4 / chunkSize);
	const chunkZ = math.floor(positionZ / 4 / chunkSize);

	LoadChunks(chunkX, chunkZ, undefined);
	if (unloadDistance >= loadDistance) {
		UnloadChunks(chunkX, chunkZ);
	}
}
