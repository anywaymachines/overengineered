import { HttpService, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import ObservableValue from "shared/event/ObservableValue";

type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

export default class PlayerDataStorage {
	public static readonly loadedSlot = new ObservableValue<number | undefined>(undefined);

	public static readonly data = new ObservableValue<NonNullableFields<PlayerDataResponse> | undefined>(undefined);
	public static readonly config = this.data.createChild("settings", {});

	static async init() {
		await this.refetchData();

		this.config.subscribe((config) => {
			Logger.info("better_camera set to " + config?.betterCamera);
			Workspace.SetAttribute("better_camera", config?.betterCamera === true);
		}, true);
	}

	static async refetchData() {
		const data = await Remotes.Client.GetNamespace("Player").Get("FetchData").CallServerAsync();
		this.data.set({
			purchasedSlots: data.purchasedSlots ?? 0,
			settings: data.settings ?? {},
			slots: data.slots ?? [],
		});

		Logger.info("Configuration loaded: " + HttpService.JSONEncode(this.config.get()));
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
