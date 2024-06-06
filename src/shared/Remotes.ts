import { Definitions, Middleware } from "@rbxts/net";
import { C2S2CRemoteFunction } from "shared/event2/PERemoteEvent";
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
} as const;
export const Remotes = Definitions.Create({
	Player: Definitions.Namespace({
		InputTypeInfo: Definitions.ClientToServerEvent<[inputType: InputType]>(),
		UpdateSettings:
			Definitions.ServerAsyncFunction<
				<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey]) => Response
			>(),
		FetchData: Definitions.ServerAsyncFunction<() => PlayerDataResponse>(),
	}),
	Ride: Definitions.Namespace({
		SetPlayMode: Definitions.ServerAsyncFunction<(mode: PlayModes) => Response>([
			Middleware.RateLimit({
				MaxRequestsPerMinute: 30,
			}),
		]),
		SetPlayModeOnClient: Definitions.ClientAsyncFunction<(mode: PlayModes | undefined) => Response>(),
		Sit: Definitions.ClientToServerEvent<[]>(),
	}),
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
