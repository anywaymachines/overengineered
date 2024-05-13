import { ReplicatedStorage } from "@rbxts/services";

export namespace ReplicatedAssets {
	export const instance = ReplicatedStorage.WaitForChild("Assets");

	export function get<T extends object = Folder>() {
		return instance as T;
	}
}
