import { RunService, TextChatService } from "@rbxts/services";
import {
	C2S2CRemoteFunction,
	C2SRemoteEvent,
	PERemoteEventMiddlewares,
	S2C2SRemoteFunction,
	S2CRemoteEvent,
} from "engine/shared/event/PERemoteEvent";
import type { damageType } from "engine/shared/BlockDamageController";
import type { baseAchievementStats } from "server/Achievement";
import type { PlayerFeature } from "server/database/PlayerDatabase";
import type { AchievementData } from "shared/AchievementData";
import type { SpawnPosition } from "shared/SpawnPositions";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel }>;
	type MultiBuildResponse = Response<{ readonly models: readonly BlockModel[] }>;

	type PlaceBlockRequest = MakePartial<BlockDataBase, "uuid" | "config"> & {
		readonly location: CFrame;
	};
	type PlaceBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly PlaceBlockRequest[];
	};
	type DeleteBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
	};
	type EditBlockRequest = {
		readonly instance: BlockModel;
		readonly position: CFrame | undefined;
		readonly scale: Vector3 | undefined;
	};
	type EditBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly EditBlockRequest[];
	};

	type LogicConnectRequest = {
		readonly plot: PlotModel;
		readonly outputBlock: BlockModel;
		readonly outputConnection: BlockConnectionName;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	};
	type LogicDisconnectRequest = {
		readonly plot: PlotModel;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	};

	type PaintBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
		readonly color?: Color4;
		readonly material?: Enum.Material;
	};
	type NormalizeRootpartsRequest = {
		readonly parts: BasePart[];
	};
	type EnvironmentBlacklistRequest = {
		readonly isBanned: boolean;
		readonly plot: BasePart;
	};
	type ConfigUpdateRequest = {
		readonly plot: PlotModel;
		readonly configs: readonly {
			readonly block: BlockModel;
			readonly scfg: string;
		}[];
	};
	type CustomDataUpdateRequest = {
		readonly plot: PlotModel;
		readonly datas: readonly {
			readonly block: BlockModel;
			readonly sdata: string;
		}[];
	};
	type ConfigResetRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[];
	};
	type WeldRequest = {
		readonly plot: PlotModel;
		readonly datas: readonly {
			readonly thisUuid: BlockUuid;
			readonly thisPart: readonly string[];
			readonly otherUuid: BlockUuid;
			readonly otherPart: readonly string[];
			readonly welded: boolean;
		}[];
	};
	type RecollideRequest = {
		readonly plot: PlotModel;
		readonly datas: readonly {
			readonly uuid: BlockUuid;
			readonly enabled: boolean;
		}[];
	};

	type PlayerUpdateSettingsRequest = PartialThrough<PlayerConfig>;
	type PlayerUpdateDataRequest = {
		readonly key: keyof OePlayerData;
		readonly value: OePlayerData[keyof OePlayerData];
	};
	type PlayerSaveSlotRequest = {
		readonly index: number;
		readonly name?: string;
		readonly color?: SerializedColor;
		readonly touchControls?: TouchControlInfo;
		readonly save: boolean;
	};
	type PlayerDeleteSlotRequest = {
		readonly index: number;
	};
	type PlayerLoadSlotRequest = {
		readonly index: number;
	};
	type PlayerLoadSlotFromHistoryRequest = {
		readonly databaseId: string;
		readonly historyId: string;
	};
	type PlayerLoadAdminSlotRequest = PlayerLoadSlotRequest & {
		readonly userid: number;
	};
}

export interface PlayerInitResponse {
	readonly remotes: Instance;
	readonly data: {
		readonly purchasedSlots: number | undefined;
		readonly settings: Partial<PlayerConfig> | undefined;
		readonly slots: readonly SlotMeta[] | undefined;
		readonly data: OePlayerData | undefined;
		readonly features: readonly PlayerFeature[] | undefined;
		readonly achievements: { readonly [k in string]: AchievementData } | undefined;
	};
}

export const CustomRemotes = {
	initPlayer: new C2S2CRemoteFunction<undefined, Response<PlayerInitResponse>>("player_init"),
	playerLoaded: new C2SRemoteEvent("player_loaded"),
	adminDataFor: new C2S2CRemoteFunction<number, Response<PlayerInitResponse>>("player_init_admin"),

	chat: {
		systemMessage: new S2CRemoteEvent<string>("chat_sysmsg", "RemoteEvent"),
	},
	updateSaves: new S2CRemoteEvent<readonly SlotMeta[]>("pl_save_update", "RemoteEvent"),
	achievements: {
		update: new S2CRemoteEvent<{ readonly [k in string]: AchievementData }>("pl_achs_updated", "RemoteEvent"),
		loaded: new S2CRemoteEvent<{
			readonly order: readonly string[];
			readonly data: { readonly [k in string]: baseAchievementStats };
		}>("pl_achs_loaded", "RemoteEvent"),

		admin_set: new C2SRemoteEvent<{ readonly [k in string]: AchievementData }>("pl_achs_adm_set", "RemoteEvent"),
		admin_reset: new C2SRemoteEvent<string[]>("pl_achs_adm_reset", "RemoteEvent"),

		ahievementUnlock: new S2CRemoteEvent<{ readonly player: Player; readonly id: string }>(
			"chat_ach_unlock",
			"RemoteEvent",
		),
	},

	damageSystem: {
		healthInit: new S2CRemoteEvent<{ block: BlockModel; health: number }[]>("block_damage_init", "RemoteEvent"),
		damageBlock: new C2S2CRemoteFunction<{ block: BlockModel; damage: damageType }>("block_damage"),
	},

	physics: {
		normalizeRootparts: new S2CRemoteEvent<NormalizeRootpartsRequest>("ph_normalize_rootparts"),
	},
	gui: {
		settings: {
			permissions: {
				isolationMode: new C2SRemoteEvent<boolean>("gui_settings_isolation"),
				updateBlacklist: new C2SRemoteEvent<readonly number[]>("gui_settings_updateblacklist"),
			},
		},
	},
	modes: {
		set: new C2S2CRemoteFunction<{ readonly mode: PlayModes; readonly pos?: SpawnPosition }>(
			"md_set",
		).addMiddleware(PERemoteEventMiddlewares.rateLimiter(30, 60)),
		setOnClient: new S2C2SRemoteFunction<PlayModes | undefined>("md_setc"),
		ride: {
			teleportOnSeat: new C2SRemoteEvent("mdr_seat"),
		},
	},
	integrityViolation: new C2SRemoteEvent<string>("integrity_violation"),
} as const;

if (RunService.IsServer()) {
	CustomRemotes.playerLoaded.invoked.Connect((player) => $log(`Received ${player.Name} loaded request`));
}
if (RunService.IsClient()) {
	CustomRemotes.chat.systemMessage.invoked.Connect((text) => {
		const channel = TextChatService.FindFirstChild("TextChannels")?.FindFirstChild("RBXGeneral") as TextChannel;
		channel?.DisplaySystemMessage(`<font color='#FAFAFA'>${text}</font>`);
	});
}
