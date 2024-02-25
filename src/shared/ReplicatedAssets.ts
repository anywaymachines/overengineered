import { ReplicatedStorage } from "@rbxts/services";

export const ReplicatedAssets = {
	get: <T extends object = Folder>() => ReplicatedStorage.Assets as T,
};
