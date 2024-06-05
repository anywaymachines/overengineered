import { HttpService, Workspace } from "@rbxts/services";
import { Backend } from "server/Backend";
import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayerData } from "server/database/PlayerDatabase";

@injectable
export class PlayerDataController extends HostedService {
	constructor(@inject private readonly players: PlayerDatabase) {
		super();

		registerOnRemoteFunction("Player", "UpdateSettings", this.updateSetting.bind(this));
		registerOnRemoteFunction("Player", "FetchData", this.fetchSettings.bind(this));

		Workspace.AddTag("data_loadable");
	}

	private updateSetting<TKey extends keyof PlayerConfig>(
		player: Player,
		key: TKey,
		value: PlayerConfig[TKey],
	): Response {
		const playerData = this.players.get(player.UserId);

		const newPlayerData: PlayerData = {
			...playerData,
			settings: {
				...(playerData.settings ?? {}),
				[key]: value,
			},
		};

		this.players.set(player.UserId, newPlayerData);
		return {
			success: true,
		};
	}
	private fetchSettings(player: Player): PlayerDataResponse {
		const data = this.players.get(player.UserId) ?? {};

		const universeId = GameDefinitions.isTestPlace()
			? GameDefinitions.PRODUCTION_UNIVERSE_ID
			: GameDefinitions.INTERNAL_UNIVERSE_ID;

		const slots: SlotMeta[] = [];

		try {
			const externalData = HttpService.JSONDecode(
				Backend.Datastores.GetEntry(universeId, "players", tostring(player.UserId)) as string,
			);

			const externalSlots = (externalData as { slots: readonly SlotMeta[] | undefined })?.slots;
			if (externalSlots) {
				for (const slot of externalSlots) {
					if (slot.blocks > 0) {
						slots.push(slot);
					}
				}
			}
		} catch (err) {
			$err("Error while loading the external slots:", err, "skipping...");
		}

		return {
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			imported_slots: slots,
		};
	}
}
