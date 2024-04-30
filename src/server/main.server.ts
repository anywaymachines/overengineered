import { HttpService, MessagingService, RunService, Workspace } from "@rbxts/services";
import { Backend } from "server/Backend";
import { BadgeController } from "server/BadgeController";
import { ServerRestartController } from "server/ServerRestartController";
import { UnreliableRemoteHandler } from "server/network/event/UnreliableRemoteHandler";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Logger } from "shared/Logger";
import { RemoteEvents } from "shared/RemoteEvents";
import { Remotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { BuildingWelder } from "./building/BuildingWelder";
import { ServerBuilding } from "./building/ServerBuilding";
import { ServerBuildingRequestHandler } from "./building/ServerBuildingRequestHandler";
import { PlayerData, PlayerDatabase } from "./database/PlayerDatabase";
import { SlotDatabase } from "./database/SlotDatabase";
import { PlayModeController } from "./modes/PlayModeController";
import { registerOnRemoteEvent, registerOnRemoteFunction } from "./network/event/RemoteHandler";
import { BlocksSerializer } from "./plots/BlocksSerializer";
import { ServerPlots } from "./plots/ServerPlots";

const logger = new Logger("MAIN");

namespace RemoteHandlers {
	export function loadSlot(player: Player, index: number): LoadSlotResponse {
		return RemoteHandlers.loadAdminSlot(SharedPlots.getPlotByOwnerID(player.UserId), player.UserId, index);
	}

	export function loadImportedSlot(player: Player, index: number): LoadSlotResponse {
		return RemoteHandlers.loadAdminImportedSlot(SharedPlots.getPlotByOwnerID(player.UserId), player.UserId, index);
	}

	export function loadSlotAsAdmin(player: Player, userid: number, index: number): LoadSlotResponse {
		if (!GameDefinitions.isAdmin(player)) {
			return {
				success: false,
				message: "Permission denied",
			};
		}

		return RemoteHandlers.loadAdminSlot(SharedPlots.getPlotByOwnerID(player.UserId), userid, index);
	}

	export function sendMessageAsAdmin(player: Player, text: string, color?: Color3, duration?: number) {
		if (!GameDefinitions.isAdmin(player)) return;

		MessagingService.PublishAsync("global_message", {
			text: text,
			color: color,
			duration: duration,
		});

		Remotes.Server.GetNamespace("Admin").Get("SendMessage").SendToAllPlayers(text, color, duration);
	}

	export function loadAdminImportedSlot(plot: PlotModel, userid: number, index: number): LoadSlotResponse {
		const start = os.clock();
		// const blocks = SlotDatabase.instance.getBlocks(userid, index);
		const universeId = GameDefinitions.isTestPlace()
			? GameDefinitions.PRODUCTION_UNIVERSE_ID
			: GameDefinitions.INTERNAL_UNIVERSE_ID;
		const blocks = Backend.Datastores.GetEntry(universeId, "slots", `${userid}_${index}`) as string;

		ServerBuilding.deleteBlocks({ plot, blocks: "all" });

		if (blocks === undefined || blocks.size() === 0) {
			return {
				success: false,
				message: "Slot is empty",
			};
		}

		logger.info(`Loading ${userid}'s slot ${index}`);
		const dblocks = BlocksSerializer.deserialize(blocks, plot);
		logger.info(`Loaded ${userid} slot ${index} in ${os.clock() - start}`);

		return { success: true, isEmpty: dblocks === 0 };
	}

	export function loadAdminSlot(plot: PlotModel, userid: number, index: number): LoadSlotResponse {
		const start = os.clock();
		const blocks = SlotDatabase.instance.getBlocks(userid, index);

		ServerBuilding.deleteBlocks({ plot, blocks: "all" });

		if (blocks === undefined || blocks.size() === 0) {
			return {
				success: false,
				message: "Slot is empty",
			};
		}

		logger.info(`Loading ${userid}'s slot ${index}`);
		const dblocks = BlocksSerializer.deserialize(blocks, plot);
		logger.info(`Loaded ${userid} slot ${index} in ${os.clock() - start}`);

		return { success: true, isEmpty: dblocks === 0 };
	}

	export function updateSetting<TKey extends keyof PlayerConfig>(
		this: void,
		player: Player,
		key: TKey,
		value: PlayerConfig[TKey],
	): Response {
		const playerData = PlayerDatabase.instance.get(player.UserId);

		const newPlayerData: PlayerData = {
			...playerData,
			settings: {
				...(playerData.settings ?? {}),
				[key]: value,
			},
		};

		PlayerDatabase.instance.set(player.UserId, newPlayerData);
		return {
			success: true,
		};
	}

	export function fetchSettings(player: Player): PlayerDataResponse {
		const data = PlayerDatabase.instance.get(player.UserId) ?? {};

		const universeId = GameDefinitions.isTestPlace()
			? GameDefinitions.PRODUCTION_UNIVERSE_ID
			: GameDefinitions.INTERNAL_UNIVERSE_ID;

		const slots: SlotMeta[] = [];

		try {
			const externalData = HttpService.JSONDecode(
				Backend.Datastores.GetEntry(universeId, "players", tostring(player.UserId)) as string,
			);

			const externalSlots = (externalData as { slots: readonly SlotMeta[] })["slots"];

			for (const slot of externalSlots) {
				if (slot.blocks > 0) {
					slots.push(slot);
				}
			}
		} catch (err) {
			logger.error(err as string);
		}

		return {
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			imported_slots: slots,
		};
	}

	export function saveSlot(player: Player, data: PlayerSaveSlotRequest): SaveSlotResponse {
		logger.info(`Saving ${player.Name}'s slot ${data.index}`);

		const output = SlotDatabase.instance.update(
			player.UserId,
			data.index,
			(meta) => {
				const get = SlotsMeta.get(meta, data.index);
				return SlotsMeta.withSlot(meta, data.index, {
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

	export function sit(player: Player) {
		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		if (hrp.Sit) return;

		const plot = SharedPlots.getPlotByOwnerID(player.UserId);
		const blocks = SharedPlots.getPlotComponent(plot).getBlocks();

		const vehicleSeatModel = blocks.find((model) => BlockManager.manager.id.get(model) === "vehicleseat") as Model;
		const vehicleSeat = vehicleSeatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		vehicleSeat.Sit(hrp);
	}
}

if (game.PrivateServerOwnerId !== 0) {
	Workspace.AddTag("PrivateServer");
}

// Plots
ServerPlots.initialize();

// Badges
BadgeController.initialize();

// Initializing event workders
registerOnRemoteFunction("Ride", "SetPlayMode", PlayModeController.changeModeForPlayer);
registerOnRemoteFunction("Slots", "Save", RemoteHandlers.saveSlot);
registerOnRemoteFunction("Slots", "Load", RemoteHandlers.loadSlot);
registerOnRemoteFunction("Slots", "LoadImported", RemoteHandlers.loadImportedSlot);
registerOnRemoteFunction("Building", "UpdateConfigRequest", ServerBuildingRequestHandler.updateConfig);
registerOnRemoteFunction("Building", "ResetConfigRequest", ServerBuildingRequestHandler.resetConfig);
registerOnRemoteFunction("Building", "PlaceBlocks", ServerBuildingRequestHandler.placeBlocks);
registerOnRemoteFunction("Building", "DeleteBlocks", ServerBuildingRequestHandler.deleteBlocks);
registerOnRemoteFunction("Building", "MoveBlocks", ServerBuildingRequestHandler.moveBlocks);
registerOnRemoteFunction("Building", "RotateBlocks", ServerBuildingRequestHandler.rotateBlocks);
registerOnRemoteFunction("Building", "LogicConnect", ServerBuildingRequestHandler.logicConnect);
registerOnRemoteFunction("Building", "LogicDisconnect", ServerBuildingRequestHandler.logicDisconnect);
registerOnRemoteFunction("Building", "PaintBlocks", ServerBuildingRequestHandler.paintBlocks);
registerOnRemoteFunction("Player", "UpdateSettings", RemoteHandlers.updateSetting);
registerOnRemoteFunction("Player", "FetchData", RemoteHandlers.fetchSettings);
registerOnRemoteEvent("Ride", "Sit", RemoteHandlers.sit);
registerOnRemoteEvent("Admin", "LoadSlot", RemoteHandlers.loadSlotAsAdmin);
registerOnRemoteEvent("Admin", "SendMessage", RemoteHandlers.sendMessageAsAdmin);
registerOnRemoteEvent("Admin", "Restart", () => ServerRestartController.restart(false));
UnreliableRemoteHandler.initialize();

// Global message networking, TODO: Move away
MessagingService.SubscribeAsync("global_message", (message) => {
	const msg = message as unknown as { text: string; color: Color3; duration: number };
	Remotes.Server.GetNamespace("Admin").Get("SendMessage").SendToAllPlayers(msg.text, msg.color, msg.duration);
});

ServerRestartController.init();

BlocksInitializer.initialize();
BuildingWelder.initialize();

PlayModeController.init();
RemoteEvents.initialize();

if (RunService.IsStudio()) {
	Logger.onLog.Connect((text, isError) => {
		Remotes.Server.GetNamespace("Debug").Get("DisplayLine").SendToAllPlayers(text, false, isError);
	});
}

Workspace.SetAttribute("loaded", true);
