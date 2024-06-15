import { Definitions } from "@rbxts/net";
import {
	C2S2CRemoteFunction,
	C2SRemoteEvent,
	PERemoteEventMiddlewares,
	S2C2SRemoteFunction,
} from "shared/event2/PERemoteEvent";
import type { BlockId } from "shared/BlockDataRegistry";
import type { PlacedBlockConfig, PlacedBlockLogicConnections } from "shared/building/BlockManager";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel | undefined }>;
	type MultiBuildResponse = Response<{ readonly models: readonly BlockModel[] }>;

	interface PlaceBlockRequest {
		readonly id: BlockId;
		readonly color: Color3;
		readonly material: Enum.Material;
		readonly location: CFrame;
		readonly uuid?: BlockUuid;
		readonly config?: PlacedBlockConfig;
		readonly connections?: PlacedBlockLogicConnections;
	}
	interface PlaceBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly PlaceBlockRequest[];
	}
	interface DeleteBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
	}
	interface EditBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly {
			readonly instance: BlockModel;
			readonly position: CFrame | undefined;
		}[];
	}

	interface LogicConnectRequest {
		readonly plot: PlotModel;
		readonly outputBlock: BlockModel;
		readonly outputConnection: BlockConnectionName;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	}
	interface LogicDisconnectRequest {
		readonly plot: PlotModel;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	}

	interface PaintBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
		readonly color?: Color3;
		readonly material?: Enum.Material;
	}
	interface ConfigUpdateRequest {
		readonly plot: PlotModel;
		readonly configs: readonly {
			readonly block: BlockModel;
			readonly key: string;
			readonly value: string;
		}[];
	}
	interface ConfigResetRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[];
	}

	type PlayerSaveSlotRequest = {
		readonly index: number;
		readonly name?: string;
		readonly color?: SerializedColor;
		readonly touchControls?: TouchControlInfo;
		readonly save: boolean;
	};

	type GameInfoBlock = {
		readonly markerPositions: { readonly [name in BlockConnectionName]?: Vector3 };
	};
	type GameInfo = {
		readonly blocks: { readonly [k in BlockId]?: GameInfoBlock };
	};
}

export const CustomRemotes = {
	building: {
		placeBlocks: new C2S2CRemoteFunction<[data: PlaceBlocksRequest], MultiBuildResponse>("rb_place"),
		deleteBlocks: new C2S2CRemoteFunction<[data: DeleteBlocksRequest]>("rb_delete"),
		editBlocks: new C2S2CRemoteFunction<[data: EditBlocksRequest]>("rb_edit"),
		logicConnect: new C2S2CRemoteFunction<[data: LogicConnectRequest]>("rb_lconnect"),
		logicDisconnect: new C2S2CRemoteFunction<[data: LogicDisconnectRequest]>("rb_ldisconnect"),
		paintBlocks: new C2S2CRemoteFunction<[data: PaintBlocksRequest]>("rb_paint"),
		updateConfig: new C2S2CRemoteFunction<[data: ConfigUpdateRequest]>("rb_updatecfg"),
		resetConfig: new C2S2CRemoteFunction<[data: ConfigResetRequest]>("rb_resetcfg"),
	},
	slots: {
		load: new C2S2CRemoteFunction<[index: number], LoadSlotResponse>("rs_load"),
		loadImported: new C2S2CRemoteFunction<[index: number], LoadSlotResponse>("rs_loadi"),
		loadAsAdmin: new C2S2CRemoteFunction<[userid: number, index: number, imported: boolean], LoadSlotResponse>(
			"rs_loadadm",
		),
		save: new C2S2CRemoteFunction<[data: PlayerSaveSlotRequest], SaveSlotResponse>("rs_save"),
	},
	player: {
		updateSettings: new C2SRemoteEvent<[key: keyof PlayerConfig, value: PlayerConfig[keyof PlayerConfig]]>(
			"pl_updsettings",
		),
		fetchData: new C2S2CRemoteFunction<[], Response<PlayerDataResponse>>("pl_fetchdata"),
	},
	modes: {
		set: new C2S2CRemoteFunction<[mode: PlayModes]>("md_set").addMiddleware(
			PERemoteEventMiddlewares.rateLimiter(30, 60),
		),
		setOnClient: new S2C2SRemoteFunction<[mode: PlayModes | undefined]>("md_setc"),
		ride: {
			teleportOnSeat: new C2SRemoteEvent("mdr_seat"),
		},
	},
} as const;
export const Remotes = Definitions.Create({
	Admin: Definitions.Namespace({
		SendMessage: Definitions.BidirectionalEvent<
			[text: string, color?: Color3, duration?: number],
			[text: string, color?: Color3, duration?: number]
		>(),
		Restart: Definitions.ClientToServerEvent<[]>(),
	}),
	ServerRestartProgress: Definitions.ServerToClientEvent<[atmosphereColor: number]>(),
	Game: Definitions.Namespace({
		GameInfo: Definitions.ServerAsyncFunction<() => GameInfo>(),
	}),
});
