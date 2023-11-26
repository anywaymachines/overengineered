import { DataStoreService, HttpService, Players } from "@rbxts/services";

export default class PlotDatabase {
	static slotsCache: { [key: number]: { slots: unknown } } = {};

	static readonly slotsDatabase = DataStoreService.GetDataStore("slots");
	static readonly dataStoreSizeLimit = 4194304; // 4 MB

	static serialize(plot: Model) {}

	static initialize() {
		// TODO
	}
}
