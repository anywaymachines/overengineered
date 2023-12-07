import { HttpService, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import ObservableValue from "shared/event/ObservableValue";

export default class PlayerDataStorage {
	public static readonly config = new ObservableValue<PlayerConfig | undefined>(undefined);

	static async init() {
		this.config.set((await Remotes.Client.GetNamespace("Player").Get("FetchSettings").CallServerAsync()) ?? {});
		Logger.info("Configuration loaded: " + HttpService.JSONEncode(this.config.get()));

		this.config.subscribe((config) => {
			Logger.info("better_camera set to " + config?.betterCamera);
			Workspace.SetAttribute("better_camera", config?.betterCamera === true);
		}, true);
	}

	static async updatePlayerConfig<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey] & defined) {
		Logger.info("Setting config value " + key + " to " + value);
		await Remotes.Client.GetNamespace("Player").Get("UpdateSettings").CallServerAsync(key, value);

		this.config.set({
			...this.config.get(),
			[key]: value,
		});
	}
}
