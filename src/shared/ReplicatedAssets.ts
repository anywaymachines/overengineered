import { ReplicatedStorage } from "@rbxts/services";

export const ReplicatedAssets = {
	get: <T extends object>() => ReplicatedStorage.Assets as T,
};
