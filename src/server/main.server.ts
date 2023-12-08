import { RunService } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/Remotes";
import SharedPlots from "shared/building/SharedPlots";
import BuildingWrapper from "./BuildingWrapper";
import PlayerDatabase from "./PlayerDatabase";
import SlotsDatabase from "./SlotsDatabase";
import DisconnectBlockLogic from "./blocks/logic/DisconnectBlockLogic";
import PlayModeController from "./modes/PlayModeController";
import { registerOnRemoteEvent, registerOnRemoteFunction } from "./network/event/RemoteHandler";
import BlocksSerializer from "./plots/BlocksSerializer";
import ServerPlots from "./plots/ServerPlots";

class RemoteHandlers {
	static loadSlot(this: void, player: Player, index: number): Response {
		const blocks = SlotsDatabase.instance.getBlocks(player.UserId, index);
		if (blocks === undefined || blocks.size() === 0) {
			return {
				success: false,
				message: "Slot is empty",
			};
		}

		Logger.info(`Loading ${player.Name}'s slot ${index}`);

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		ServerPlots.clearAllBlocks(plot);
		const dblocks = BlocksSerializer.current.deserialize(blocks);
		BlocksSerializer.deserialize(plot, dblocks);

		return { success: true };
	}

	static updateSetting<TKey extends keyof PlayerConfig>(
		this: void,
		player: Player,
		key: TKey,
		value: PlayerConfig[TKey],
	): Response {
		const playerData = PlayerDatabase.instance.get(tostring(player.UserId));

		const newPlayerData = {
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

		const output = SlotsDatabase.instance.update(
			player.UserId,
			data.index,
			(meta) =>
				meta.set(data.index, {
					...meta.get(data.index),
					name: data.name ?? meta.get(data.index).name,
					color: data.color ?? meta.get(data.index).color,
					touchControls: data.touchControls ?? meta.get(data.index).touchControls,
				}),
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
		vehicleSeat.Sit(hrp);
	}
}

// Plots
ServerPlots.initialize();

// Initializing event workders
registerOnRemoteFunction("Building", "PlaceBlockRequest", BuildingWrapper.placeBlockAsPlayer);
registerOnRemoteFunction("Building", "MoveRequest", BuildingWrapper.movePlotAsPlayer);
registerOnRemoteFunction("Building", "Delete", BuildingWrapper.deleteBlockAsPlayer);
registerOnRemoteFunction("Ride", "SetPlayMode", PlayModeController.changeModeForPlayer);
registerOnRemoteFunction("Slots", "Save", RemoteHandlers.saveSlot);
registerOnRemoteFunction("Slots", "Load", RemoteHandlers.loadSlot);
registerOnRemoteFunction("Building", "UpdateConfigRequest", BuildingWrapper.updateConfigAsPlayer);
registerOnRemoteFunction("Player", "UpdateSettings", RemoteHandlers.updateSetting);
registerOnRemoteFunction("Player", "FetchData", RemoteHandlers.fetchSettings);
registerOnRemoteEvent("Ride", "Sit", RemoteHandlers.sit);

DisconnectBlockLogic.init();

PlayModeController.init();

if (RunService.IsStudio()) {
	Logger.onLog.Connect((text, isError) => {
		Remotes.Server.GetNamespace("Debug").Get("DisplayLine").SendToAllPlayers(text, false, isError);
	});
}
