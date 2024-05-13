import { ReplicatedStorage } from "@rbxts/services";

export namespace Instances {
	export const assets = ReplicatedStorage.WaitForChild("Assets") as Folder;

	export function waitForChild<T = Instance>(object: Instance, ...path: string[]): T {
		let ret: Instance = object;
		for (const part of path) {
			ret = object.WaitForChild(part);
		}

		return ret as T;
	}
}
