import { ReplicatedStorage } from "@rbxts/services";

export namespace ReplicatedAssets {
	export function get<T extends object = Folder>() {
		return ReplicatedStorage.Assets as T;
	}
}
