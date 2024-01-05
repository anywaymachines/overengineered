import { ReplicatedFirst } from "@rbxts/services";

export type TerrainData = {
	thickness: number;
	shift: number;
	waterHeight: number;
	minimumHeight: number;
	maximumHeight: number;
	noises: { 1: 28135.1; 2: 150; 3: 0.006; 4: 0.4; 5: 10 }[];
	materials: { 1: 1296; 2: -10000; 3: 8; 4: 0; 5: 7 }[];
	models: { 1: string; 2: 10; 3: 8; 4: 175; 5: 0; 6: 5; 7: { 1: 1; 2: 24232.388; 3: 0.007; 4: 0.2; 5: 10 }[] }[];
};
export type TerrainInfo = {
	Data: Instance & {
		TerrainData: ModuleScript;
		HeightData: Folder;
		MaterialData: Folder;
	};
	Configuration: {
		ActorAmount: IntValue;
		ChunkSize: IntValue;
		LoadDistance: IntValue;
		UnloadDistance: IntValue;
	};
};

export default class TerrainDataInfo {
	static getInfo(): Folder & TerrainInfo {
		return ReplicatedFirst.WaitForChild("Terrain") as Folder & TerrainInfo;
	}

	static getData(): TerrainData {
		return require(this.getInfo().Data.TerrainData) as TerrainData;
	}
}
