/* eslint-disable import/order */
import { TestFramework } from "shared/test/TestFramework";
if (!game.GetService("RunService").IsStudio()) {
	for (const testscript of TestFramework.findAllTestScripts()) {
		testscript.Destroy();
	}
}

import { HttpService, Workspace } from "@rbxts/services";
import { Backend } from "server/Backend";
import type { PlayerData } from "server/database/PlayerDatabase";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { UnreliableRemoteHandler } from "server/network/event/UnreliableRemoteHandler";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { SandboxGame } from "server/SandboxGame";
import { Game } from "shared/GameHost";

namespace RemoteHandlers {
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
}

const builder = Game.createHost();
SandboxGame.initialize(builder);

const host = builder.build();
host.run();

// Initializing event workders
registerOnRemoteFunction("Player", "UpdateSettings", RemoteHandlers.updateSetting);
registerOnRemoteFunction("Player", "FetchData", RemoteHandlers.fetchSettings);
UnreliableRemoteHandler.initialize();

RemoteEvents.initialize();

$log("Server loaded.");
Workspace.AddTag("GameLoaded");
