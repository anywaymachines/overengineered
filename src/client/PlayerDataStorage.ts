import { HttpService, Players, Workspace } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { Logger } from "shared/Logger";
import { Remotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import { Config } from "shared/config/Config";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";
import { JSON, JsonSerializablePrimitive } from "shared/fixes/Json";

type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

export namespace PlayerDataStorage {
	const logger = new Logger("PlayerDataStorage");

	export const loadedSlot = new ObservableValue<number | undefined>(undefined);

	export const data = new ObservableValue<NonNullableFields<PlayerDataResponse> | undefined>(undefined);
	export const config = data.createChild(
		"settings",
		Config.addDefaults({}, PlayerConfigDefinition),
	) as ObservableValue<Required<PlayerConfig>>;
	export const slots = data.createChild("slots", []);
	export const imported_slots = data.createChild("imported_slots", []);

	export async function init() {
		await refetchData();

		config.createNullableChild("betterCamera", undefined).subscribe((betterCamera) => {
			logger.info("better_camera set to " + HttpService.JSONEncode(betterCamera));
			Workspace.SetAttribute("camera_improved", betterCamera?.improved === true);
			Workspace.SetAttribute("camera_playerCentered", betterCamera?.playerCentered === true);
			Workspace.SetAttribute("camera_strictFollow", betterCamera?.strictFollow === true);
		}, true);
	}

	export async function refetchData() {
		const d = await Remotes.Client.GetNamespace("Player").Get("FetchData").CallServerAsync();
		logger.info("Configuration received: " + HttpService.JSONEncode(config.get()));

		data.set({
			purchasedSlots: d.purchasedSlots ?? 0,
			settings: Config.addDefaults(d.settings ?? {}, PlayerConfigDefinition),
			slots: SlotsMeta.getAll(
				d.slots ?? [],
				GameDefinitions.getMaxSlots(Players.LocalPlayer, d.purchasedSlots ?? 0),
			),
			imported_slots: d.imported_slots ?? [],
		});

		logger.info("Configuration loaded: " + HttpService.JSONEncode(config.get()));
	}

	export async function sendPlayerConfigValue<TKey extends keyof PlayerConfig>(
		key: TKey,
		value: PlayerConfig[TKey] & defined,
	) {
		logger.info(`Setting player config value ${key} to ${JSON.serialize(value as JsonSerializablePrimitive)}`);
		await Remotes.Client.GetNamespace("Player").Get("UpdateSettings").CallServerAsync(key, value);

		config.set({
			...config.get(),
			[key]: value,
		});
	}

	export async function sendPlayerSlot(req: PlayerSaveSlotRequest) {
		logger.info("Setting slot " + req.index + " to " + HttpService.JSONEncode(req));

		let d = data.get();
		if (d) {
			data.set({
				...d,
				slots: SlotsMeta.withSlot(d.slots, req.index, req),
			});
		}

		const response = await Remotes.Client.GetNamespace("Slots").Get("Save").CallServerAsync(req);
		if (!response.success) {
			logger.error(response.message);
			return;
		}

		d = data.get();
		if (d) {
			data.set({
				...data.get()!,
				slots: SlotsMeta.withSlot(d.slots, req.index, {
					blocks: response.blocks ?? SlotsMeta.get(d.slots, req.index).blocks,
					size: response.size ?? SlotsMeta.get(d.slots, req.index).size,
				}),
			});
		}
	}

	export async function loadPlayerSlot(index: number) {
		logger.info("Loading slot " + index);
		LoadingController.show("Loading a slot");

		try {
			const response = await Remotes.Client.GetNamespace("Slots").Get("Load").CallServerAsync(index);
			if (response.success && !response.isEmpty) {
				loadedSlot.set(index);
			}

			return response;
		} finally {
			LoadingController.hide();
		}
	}
}
