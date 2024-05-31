/* eslint-disable import/order */
import { TestFramework } from "shared/test/TestFramework";
if (!game.GetService("RunService").IsStudio()) {
	for (const testscript of TestFramework.findAllTestScripts()) {
		testscript.Destroy();
	}
}

import { HttpService, MessagingService, RunService, Workspace } from "@rbxts/services";
import { Backend } from "server/Backend";
import type { PlayerData } from "server/database/PlayerDatabase";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { registerOnRemoteEvent, registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { UnreliableRemoteHandler } from "server/network/event/UnreliableRemoteHandler";
import type { ServerRestartController } from "server/ServerRestartController";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { Remotes } from "shared/Remotes";
import { SandboxGame } from "server/SandboxGame";
import { DIContainer } from "shared/DI";

namespace RemoteHandlers {
	export function sendMessageAsAdmin(player: Player, text: string, color?: Color3, duration?: number) {
		if (!GameDefinitions.isAdmin(player)) return;

		MessagingService.PublishAsync("global_message", {
			text: text,
			color: color,
			duration: duration,
		});

		Remotes.Server.GetNamespace("Admin").Get("SendMessage").SendToAllPlayers(text, color, duration);
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
			$err(err as string);
		}

		return {
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			imported_slots: slots,
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

const di = new DIContainer();
di.regResolve(SandboxGame);

// Initializing event workders
registerOnRemoteFunction("Player", "UpdateSettings", RemoteHandlers.updateSetting);
registerOnRemoteFunction("Player", "FetchData", RemoteHandlers.fetchSettings);
registerOnRemoteEvent("Ride", "Sit", RemoteHandlers.sit);
registerOnRemoteEvent("Admin", "SendMessage", RemoteHandlers.sendMessageAsAdmin);
registerOnRemoteEvent("Admin", "Restart", () => di.resolve<ServerRestartController>().restart(false));
UnreliableRemoteHandler.initialize();

// Global message networking, TODO: Move away
if (!RunService.IsStudio()) {
	MessagingService.SubscribeAsync("global_message", (message) => {
		const msg = message as unknown as { text: string; color: Color3; duration: number };
		Remotes.Server.GetNamespace("Admin").Get("SendMessage").SendToAllPlayers(msg.text, msg.color, msg.duration);
	});
}

RemoteEvents.initialize();

$log("Server loaded.");
Workspace.AddTag("GameLoaded");
