import { Component } from "engine/shared/component/Component";
import { Objects } from "engine/shared/fixes/Objects";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";
import type { PlayerDataStorageRemotesPlayer } from "shared/remotes/PlayerDataRemotes";

@injectable
export class PlayerDataController extends Component {
	constructor(
		private readonly playerId: number,
		playerRemotes: PlayerDataStorageRemotesPlayer,
		@inject private readonly players: PlayerDatabase,
	) {
		super();

		this.event.subscribe(playerRemotes.updateSettings.invoked, (p, arg) => this.updateSetting(arg));
		this.event.subscribe(playerRemotes.updateData.invoked, (p, arg) => this.updateData(arg));
		playerRemotes.fetchData.subscribe(() => this.fetchSettings());
	}

	private updateSetting(config: PlayerUpdateSettingsRequest): Response {
		const playerData = this.players.get(this.playerId);

		const newPlayerData: PlayerDatabaseData = {
			...playerData,
			settings: Objects.deepCombine(playerData.settings ?? {}, config),
		};

		this.players.set(this.playerId, newPlayerData);
		return { success: true };
	}
	private updateData({ key, value }: PlayerUpdateDataRequest): Response {
		const playerData = this.players.get(this.playerId);

		const newPlayerData: PlayerDatabaseData = {
			...playerData,
			data: {
				...(playerData.data ?? {}),
				[key]: value,
			},
		};

		this.players.set(this.playerId, newPlayerData);
		return { success: true };
	}
	private fetchSettings(): Response<PlayerDataResponse> {
		const data = this.players.get(this.playerId) ?? {};

		return {
			success: true,
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			data: data.data,
			features: data.features,
			achievements: data.achievements,
		};
	}
}
