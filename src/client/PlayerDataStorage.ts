import { HttpService, Workspace } from "@rbxts/services";
import GameDefinitions from "shared/GameDefinitions";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SlotsMeta from "shared/SlotsMeta";
import ObservableValue from "shared/event/ObservableValue";

type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

export default class PlayerDataStorage {
	public static readonly loadedSlot = new ObservableValue<number | undefined>(undefined);

	public static readonly data = new ObservableValue<NonNullableFields<PlayerDataResponse> | undefined>(undefined);
	public static readonly config = this.data.createChild("settings", {});
	public static readonly slots = this.data.createChild("slots", []);

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
			slots: SlotsMeta.getAll(data.slots ?? [], GameDefinitions.FREE_SLOTS + (data.purchasedSlots ?? 0)),
		});

		Logger.info("Configuration loaded: " + HttpService.JSONEncode(this.config.get()));
	}

	static async sendPlayerConfigValue<TKey extends keyof PlayerConfig>(
		key: TKey,
		value: PlayerConfig[TKey] & defined,
	) {
		Logger.info("Setting config value " + key + " to " + value);
		await Remotes.Client.GetNamespace("Player").Get("UpdateSettings").CallServerAsync(key, value);

		this.config.set({
			...this.config.get(),
			[key]: value,
		});
	}

	static async sendPlayerSlot(req: PlayerSaveSlotRequest) {
		Logger.info("Setting slot " + req.index + " to " + HttpService.JSONEncode(req));

		let data = this.data.get();
		if (data) {
			this.data.set({
				...data,
				slots: SlotsMeta.with(data.slots, req.index, req),
			});
		}

		const response = await Remotes.Client.GetNamespace("Slots").Get("Save").CallServerAsync(req);
		if (!response.success) {
			Logger.error(response.message);
			return;
		}

		data = this.data.get();
		if (data) {
			this.data.set({
				...this.data.get()!,
				slots: SlotsMeta.with(data.slots, req.index, {
					blocks: response.blocks ?? SlotsMeta.get(data.slots, req.index).blocks,
					size: response.size ?? SlotsMeta.get(data.slots, req.index).size,
				}),
			});
		}
	}

	static async loadPlayerSlot(index: number) {
		Logger.info("Loading slot " + index);

		const response = await Remotes.Client.GetNamespace("Slots").Get("Load").CallServerAsync(index);
		if (response.success && !response.isEmpty) {
			this.loadedSlot.set(index);
		}

		return response;
	}
}
