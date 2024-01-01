import { ReplicatedFirst, ReplicatedStorage, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";

type TerrainData = {
	thickness: number;
	shift: number;
	waterHeight: number;
	minimumHeight: number;
	maximumHeight: number;
	noises: { 1: 28135.1; 2: 150; 3: 0.006; 4: 0.4; 5: 10 }[];
	materials: { 1: 1296; 2: -10000; 3: 8; 4: 0; 5: 7 }[];
	models: { 1: string; 2: 10; 3: 8; 4: 175; 5: 0; 6: 5; 7: { 1: 1; 2: 24232.388; 3: 0.007; 4: 0.2; 5: 10 }[] }[];
};

const folder = ReplicatedFirst.WaitForChild("Terrain") as Folder & {
	Data: Instance;
	Configuration: {
		ActorAmount: IntValue;
		ChunkSize: IntValue;
		LoadDistance: IntValue;
		UnloadDistance: IntValue;
	};
};
const terrainChild = folder.Data.FindFirstChild("TerrainData") as ModuleScript;
const heightChild = folder.Data.FindFirstChild("HeightData") as Folder;
const materialChild = folder.Data.FindFirstChild("MaterialData") as Folder;

if (!terrainChild) {
	throw "No terrin";
}

const chunkSize = folder.Configuration.ChunkSize.Value;
const terrainData = require(terrainChild) as TerrainData;
const heightData: number[][] = [];
const materialData: number[][] = [];

if (heightChild) {
	for (const child of heightChild.GetDescendants()) {
		if (child.ClassName !== "ModuleScript") {
			continue;
		}

		const data = require(child as ModuleScript) as [...[n: number, a: number[]]];
		const position = child.GetAttribute("Position") as Vector3;

		for (let i = 0; i < data.size(); i += 2) {
			const x = position.X + (data[i] as number);
			const zData = data[i + 1] as number[];

			heightData[x] ??= [];
			for (let j = 0; j < zData.size(); j += 2) {
				const z = position.Y + zData[j];
				const height = zData[j + 1];
				heightData[x][z] = height;
			}
		}
	}
}

if (materialChild) {
	for (const child of materialChild.GetDescendants()) {
		if (child.ClassName !== "ModuleScript") {
			continue;
		}

		const data = require(child as ModuleScript) as [...[n: number, a: number[]]];
		const position = child.GetAttribute("Position") as Vector3;

		for (let i = 0; i < data.size(); i += 2) {
			const x = position.X + (data[i] as number);
			const zData = data[i + 1] as number[];
			materialData[x] ??= [];

			for (let j = 1; j < zData.size(); j += 2) {
				const z = position.Y + zData[j];
				const material = zData[j + 1];
				materialData[x][z] = material;
			}
		}
	}
}

const materialEnums: Record<number, Enum.Material> = {};
for (const item of Enum.Material.GetEnumItems()) {
	materialEnums[item.Value] = item;
}

const GetHeight = (x: number, z: number) => {
	if (heightData[x]?.[z] !== undefined) {
		return heightData[x][z];
	}

	let height = 0;
	for (const data of terrainData.noises) {
		const noise = math.noise((x + 1) * data[3], data[1], (z + 1) * data[3]);
		height += math.clamp(noise, data[4], data[5]) * data[2];
	}

	height += terrainData.shift;
	height = math.clamp(height, terrainData.minimumHeight, terrainData.maximumHeight);
	return height;
};

const infterrainActor = {
	Load: new Signal<(chunkX: number, chunkZ: number) => void>(),
	Unload: new Signal<(chunkX: number, chunkZ: number) => void>(),
} as const;

infterrainActor.Load.ConnectParallel((chunkX: number, chunkZ: number) => {
	const startX = chunkX * chunkSize;
	const startZ = chunkZ * chunkSize;
	const endX = startX + chunkSize - 1;
	const endZ = startZ + chunkSize - 1;
	const heights: number[][] = [];
	const models: { readonly 1: Model; readonly 2: CFrame; readonly 3: Vector3 }[] = [];
	let minimumHeight = math.huge;
	let maximumHeight = -math.huge;

	for (let x = startX - 1 - 1; x < endX + 1; x++) {
		heights[x] = [];

		for (let z = startZ - 1 - 1; z < endZ + 1; z++) {
			const height = GetHeight(x, z);
			minimumHeight = math.min(height, minimumHeight);
			maximumHeight = math.max(height, maximumHeight);
			heights[x][z] = height;
		}
	}

	minimumHeight -= terrainData.thickness;
	maximumHeight = math.max(maximumHeight, terrainData.waterHeight);
	minimumHeight = math.floor(minimumHeight / 4) * 4;
	maximumHeight = math.ceil(maximumHeight / 4) * 4;
	const region = new Region3(
		new Vector3(startX * 4, minimumHeight, startZ * 4),
		new Vector3(endX * 4 + 4, maximumHeight, endZ * 4 + 4),
	);
	const [materials, occupancys] = Workspace.Terrain.ReadVoxels(region, 4);

	for (let x = 0; x < materials.Size.X; x++) {
		for (let z = 0; z < materials.Size.Z; z++) {
			const voxelX = startX + x - 1 + 1;
			const voxelZ = startZ + z - 1 + 1;
			const height = heights[voxelX][voxelZ];
			let [nMinimumHeight, nMaximumHeight] = [math.huge, -math.huge];

			for (let nx = voxelX - 1 - 1; nx < voxelX + 1; nx++) {
				for (let nz = voxelZ - 1 - 1; nz < voxelZ + 1; nz++) {
					const height = heights[nx][nz];
					nMinimumHeight = math.min(height, nMinimumHeight);
					nMaximumHeight = math.max(height, nMaximumHeight);
				}
			}

			const slope = nMaximumHeight - nMinimumHeight;
			let material: Enum.Material = undefined!;

			if (materialData[voxelX]?.[voxelZ] !== undefined) {
				material = materialEnums[materialData[voxelX][voxelZ]];
			} else {
				for (const materialData of terrainData.materials) {
					if (height < materialData[2] || height >= materialData[3]) {
						continue;
					}
					if (slope < materialData[4] || slope >= materialData[5]) {
						continue;
					}

					material = materialEnums[materialData[1]];
					break;
				}
			}

			for (const modelData of terrainData.models) {
				if (math.fmod(voxelX, modelData[2]) !== 0 || math.fmod(voxelZ, modelData[2]) !== 0) {
					continue;
				}
				if (height < modelData[3] || height >= modelData[4]) {
					continue;
				}
				if (slope < modelData[5] || slope >= modelData[6]) {
					continue;
				}
				let load = true;
				let offset = new Vector3(0, 0, 0);
				let scale = new Vector3(1, 1, 1);
				let rotation = new Vector3(0, 0, 0);
				for (const data of modelData[7]) {
					if (data[1] === 1) {
						const noise = math.noise(voxelX * data[3], data[2], voxelZ * data[3]);
						if (noise < data[4] || noise >= data[5]) {
							load = false;
							break;
						}
					} else if (data[1] === 2) {
						offset = offset.add(
							new Vector3(
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								0,
								0,
							),
						);
					} else if (data[1] === 3) {
						offset = offset.add(
							new Vector3(
								0,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								0,
							),
						);
					} else if (data[1] === 4) {
						offset = offset.add(
							new Vector3(
								0,
								0,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
							),
						);
					} else if (data[1] === 5) {
						scale = scale.mul(data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5]);
					} else if (data[1] === 6) {
						scale = scale.mul(
							new Vector3(
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								1,
								1,
							),
						);
					} else if (data[1] === 7) {
						scale = scale.mul(
							new Vector3(
								1,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								1,
							),
						);
					} else if (data[1] === 8) {
						scale = scale.mul(
							new Vector3(
								1,
								1,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
							),
						);
					} else if (data[1] === 9) {
						rotation = rotation.add(
							new Vector3(
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								0,
								0,
							),
						);
					} else if (data[1] === 10) {
						rotation = rotation.add(
							new Vector3(
								0,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
								0,
							),
						);
					} else if (data[1] === 11) {
						rotation = rotation.add(
							new Vector3(
								0,
								0,
								data[4] + math.noise(voxelX * data[3], data[2], voxelZ * data[3]) * data[5],
							),
						);
					}
				}
				if (!load) {
					continue;
				}
				if (scale.X <= 0 || scale.Y <= 0 || scale.Z <= 0) {
					continue;
				}

				const data = {
					1: ReplicatedStorage.FindFirstChild("TerrainModels")!.FindFirstChild(modelData[1]) as Model,
					2: new CFrame(new Vector3(voxelX * 4, height, voxelZ * 4).add(offset)).mul(
						CFrame.fromOrientation(math.rad(rotation.X), math.rad(rotation.Y), math.rad(rotation.Z)),
					),
					3: scale,
				} as const;
				models.push(data);

				break;
			}

			for (let y = 0; y < materials.Size.Y; y++) {
				if (materials[x][y][z] !== Enum.Material.Air) {
					continue;
				}
				const yHeight = minimumHeight + (y + 1) * 4 - 2;
				let occupancy = (height - yHeight) / 4;

				if (occupancy > 0) {
					materials[x][y][z] = material;
					occupancys[x][y][z] = occupancy;
				} else {
					occupancy = (terrainData.waterHeight - yHeight) / 4;
					if (occupancy <= 0) {
						continue;
					}

					materials[x][y][z] = Enum.Material.Water;
					occupancys[x][y][z] = occupancy;
				}
			}
		}
	}
	task.synchronize();
	game.Workspace.Terrain.WriteVoxels(region, 4, materials, occupancys);
	if (models.size() === 0) {
		return;
	}

	const folder = new Instance("Folder");
	folder.Name = chunkX + "," + chunkZ;
	folder.Parent = Workspace.Terrain;

	for (const data of models) {
		const clone = data[1].Clone();
		clone.PivotTo(data[2]);

		for (const descendant of clone.GetDescendants()) {
			if (!descendant.IsA("BasePart")) {
				continue;
			}

			descendant.PivotOffset = descendant.PivotOffset.add(
				descendant.PivotOffset.Position.mul(data[3]).sub(descendant.PivotOffset.Position),
			);
			descendant.Position = data[2].Position.add(descendant.Position.sub(data[2].Position).mul(data[3]));
			descendant.Size = descendant.Size.mul(data[3]);
		}
		clone.Parent = folder;
	}
});

infterrainActor.Unload.ConnectParallel((chunkX: number, chunkZ: number) => {
	const startX = chunkX * chunkSize;
	const startZ = chunkZ * chunkSize;
	const endX = startX + chunkSize - 1;
	const endZ = startZ + chunkSize - 1;
	let minimumHeight = math.huge;
	let maximumHeight = -math.huge;

	for (let x = startX - 1 - 1; x < endX + 1; x++) {
		for (let z = startZ - 1 - 1; z < endZ + 1; z++) {
			const height = GetHeight(x, z);
			minimumHeight = math.min(height, minimumHeight);
			maximumHeight = math.max(height, maximumHeight);
		}
	}

	minimumHeight -= terrainData.thickness;
	maximumHeight = math.max(maximumHeight, terrainData.waterHeight);
	minimumHeight = math.floor(minimumHeight / 4) * 4;
	maximumHeight = math.ceil(maximumHeight / 4) * 4;
	const region = new Region3(
		new Vector3(startX * 4, minimumHeight, startZ * 4),
		new Vector3(endX * 4 + 4, maximumHeight, endZ * 4 + 4),
	);
	const [materials, occupancys] = game.Workspace.Terrain.ReadVoxels(region, 4);

	for (let x = 0; x < materials.Size.X; x++) {
		for (let z = 0; z < materials.Size.Z; z++) {
			for (let y = 0; y < materials.Size.Y; y++) {
				materials[x][y][z] = Enum.Material.Air;
				occupancys[x][y][z] = 0;
			}
		}
	}
	task.synchronize();
	game.Workspace.Terrain.WriteVoxels(region, 4, materials, occupancys);
	const folder = Workspace.Terrain.FindFirstChild(chunkX + "," + chunkZ);
	if (!folder) {
		return;
	}
	folder.Destroy();
});

export default infterrainActor;
