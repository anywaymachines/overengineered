import { RunService } from "@rbxts/services";
import Logger from "shared/Logger";
import RemoteEvents from "shared/RemoteEvents";
import Remotes from "shared/Remotes";
import SlotsMeta from "shared/SlotsMeta";
import SharedPlots from "shared/building/SharedPlots";
import GameDefinitions from "shared/data/GameDefinitions";
import BuildingWrapper from "./BuildingWrapper";
import PlayerDatabase, { PlayerData } from "./database/PlayerDatabase";
import SlotDatabase from "./database/SlotDatabase";
import PlayModeController from "./modes/PlayModeController";
import { registerOnRemoteEvent, registerOnRemoteFunction } from "./network/event/RemoteHandler";
import UnreliableRemoteHandler from "./network/event/UnreliableRemoteHandler";
import BlocksSerializer from "./plots/BlocksSerializer";
import ServerPlots from "./plots/ServerPlots";

class RemoteHandlers {
	static loadSlot(this: void, player: Player, index: number): LoadSlotResponse {
		return RemoteHandlers.loadAdminSlot(player, player.UserId, index);
	}
	static loadSlotAsAdmin(this: void, player: Player, userid: number, index: number): LoadSlotResponse {
		if (!GameDefinitions.isAdmin(player)) {
			return {
				success: false,
				message: "Permission denied",
			};
		}

		return RemoteHandlers.loadAdminSlot(player, userid, index);
	}

	static loadAdminSlot(this: void, player: Player, userid: number, index: number): LoadSlotResponse {
		const blocks = SlotDatabase.instance.getBlocks(userid, index);
		if (blocks === undefined || blocks.size() === 0) {
			return {
				success: false,
				message: "Slot is empty",
			};
		}

		Logger.info(`Loading ${player.Name}'s slot ${index}`);

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		ServerPlots.clearAllBlocks(plot);
		const dblocks = BlocksSerializer.deserialize(blocks, plot);

		return { success: true, isEmpty: dblocks === 0 };
	}

	static updateSetting<TKey extends keyof PlayerConfig>(
		this: void,
		player: Player,
		key: TKey,
		value: PlayerConfig[TKey],
	): Response {
		const playerData = PlayerDatabase.instance.get(tostring(player.UserId));

		const newPlayerData: PlayerData = {
			...playerData,
			settings: {
				...(playerData.settings ?? {}),
				[key]: value,
			},
		};

		PlayerDatabase.instance.set(tostring(player.UserId), newPlayerData);
		return {
			success: true,
		};
	}
	static fetchSettings(this: void, player: Player): PlayerDataResponse {
		const data = PlayerDatabase.instance.get(tostring(player.UserId)) ?? {};

		return {
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
		};
	}

	static saveSlot(this: void, player: Player, data: PlayerSaveSlotRequest): SaveSlotResponse {
		Logger.info(`Saving ${player.Name}'s slot ${data.index}`);

		const output = SlotDatabase.instance.update(
			player.UserId,
			data.index,
			(meta) => {
				const get = SlotsMeta.get(meta, data.index);
				return SlotsMeta.with(meta, data.index, {
					name: data.name ?? get.name,
					color: data.color ?? get.color,
					touchControls: data.touchControls ?? get.touchControls,
				});
			},
			data.save,
		);

		return {
			...output,
			success: true,
		};
	}

	static sit(this: void, player: Player) {
		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		if (hrp.Sit) return;

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotBlocks(plot).GetChildren();

		const vehicleSeatModel = blocks.find((model) => model.GetAttribute("id") === "vehicleseat") as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		vehicleSeat.Sit(hrp);
	}
}

// Plots
ServerPlots.initialize();

// Initializing event workders
registerOnRemoteFunction("Building", "PlaceBlockRequest", BuildingWrapper.placeBlockAsPlayer);
registerOnRemoteFunction("Building", "MoveRequest", BuildingWrapper.movePlotAsPlayer);
registerOnRemoteFunction("Building", "Delete", BuildingWrapper.deleteBlockAsPlayer);
registerOnRemoteFunction("Building", "Paint", BuildingWrapper.paintAsPlayer);
registerOnRemoteFunction("Ride", "SetPlayMode", PlayModeController.changeModeForPlayer);
registerOnRemoteFunction("Slots", "Save", RemoteHandlers.saveSlot);
registerOnRemoteFunction("Slots", "Load", RemoteHandlers.loadSlot);
registerOnRemoteFunction("Building", "UpdateConfigRequest", BuildingWrapper.updateConfigAsPlayer);
registerOnRemoteFunction("Building", "UpdateLogicConnectionRequest", BuildingWrapper.updateLogicConnectionAsPlayer);
registerOnRemoteFunction("Player", "UpdateSettings", RemoteHandlers.updateSetting);
registerOnRemoteFunction("Player", "FetchData", RemoteHandlers.fetchSettings);
registerOnRemoteEvent("Ride", "Sit", RemoteHandlers.sit);
registerOnRemoteEvent("Admin", "LoadSlot", RemoteHandlers.loadSlotAsAdmin);
UnreliableRemoteHandler.init();

PlayModeController.init();
RemoteEvents.initialize();

if (RunService.IsStudio()) {
	Logger.onLog.Connect((text, isError) => {
		Remotes.Server.GetNamespace("Debug").Get("DisplayLine").SendToAllPlayers(text, false, isError);
	});
}
