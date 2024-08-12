import { ReplicatedStorage, RunService, ServerScriptService, StarterPlayer } from "@rbxts/services";
import { Instances } from "shared/fixes/Instances";

export namespace SharedImpl {
	export function getSharedImpl(scriptobj: LuaSourceContainer): ModuleScript {
		const getPathRelativeToReplicatedStorage = (instance: Instance): string[] => {
			if (!instance.Parent) {
				throw "Script not in replicated storage";
			}
			if (instance.Parent === ReplicatedStorage) {
				return [instance.Name];
			}

			return [...getPathRelativeToReplicatedStorage(instance.Parent), instance.Name];
		};
		const path = getPathRelativeToReplicatedStorage(scriptobj);
		path[path.size() - 1] = "@" + path[path.size() - 1];

		if (RunService.IsClient()) {
			return Instances.waitForChild(StarterPlayer, "StarterPlayerScripts", ...path);
		}
		if (RunService.IsServer()) {
			return Instances.waitForChild(ServerScriptService, ...path);
		}

		throw "what";
	}
}
