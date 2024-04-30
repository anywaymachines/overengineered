import { Definitions, Middleware } from "@rbxts/net";
import { PlacedBlockConfig, PlacedBlockLogicConnections } from "shared/building/BlockManager";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel | undefined }>;
	type MultiBuildResponse = Response<{ readonly models: readonly BlockModel[] }>;

	interface PlaceBlockRequest {
		readonly id: string;
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
	interface MoveBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
		readonly diff: Vector3;
	}
	interface RotateBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
		readonly pivot: Vector3;
		readonly diff: CFrame;
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
}

export const Remotes = Definitions.Create({
	Player: Definitions.Namespace({
		InputTypeInfo: Definitions.ClientToServerEvent<[inputType: InputType]>(),
		UpdateSettings:
			Definitions.ServerAsyncFunction<
				<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey]) => Response
			>(),
		FetchData: Definitions.ServerAsyncFunction<() => PlayerDataResponse>(),
	}),
	Building: Definitions.Namespace({
		UpdateConfigRequest: Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),
		ResetConfigRequest: Definitions.ServerAsyncFunction<(data: ConfigResetRequest) => Response>(),

		PlaceBlocks: Definitions.ServerAsyncFunction<(data: PlaceBlocksRequest) => MultiBuildResponse>(),
		DeleteBlocks: Definitions.ServerAsyncFunction<(data: DeleteBlocksRequest) => Response>(),
		MoveBlocks: Definitions.ServerAsyncFunction<(data: MoveBlocksRequest) => Response>(),
		RotateBlocks: Definitions.ServerAsyncFunction<(data: RotateBlocksRequest) => Response>(),
		LogicConnect: Definitions.ServerAsyncFunction<(data: LogicConnectRequest) => Response>(),
		LogicDisconnect: Definitions.ServerAsyncFunction<(data: LogicDisconnectRequest) => Response>(),
		PaintBlocks: Definitions.ServerAsyncFunction<(data: PaintBlocksRequest) => Response>(),
	}),
	Slots: Definitions.Namespace({
		Load: Definitions.ServerAsyncFunction<(index: number) => LoadSlotResponse>([
			Middleware.RateLimit({ MaxRequestsPerMinute: 8 }),
		]),
		LoadImported: Definitions.ServerAsyncFunction<(index: number) => LoadSlotResponse>([
			Middleware.RateLimit({
				MaxRequestsPerMinute: 4,
			}),
		]),
		Save: Definitions.ServerAsyncFunction<(data: PlayerSaveSlotRequest) => SaveSlotResponse>([
			Middleware.RateLimit({
				MaxRequestsPerMinute: 60,
			}),
		]),
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
	Debug: Definitions.Namespace({
		DisplayLine: Definitions.ServerToClientEvent<[text: string, isClient: boolean, isError: boolean]>(),
	}),
	Admin: Definitions.Namespace({
		LoadSlot: Definitions.ClientToServerEvent<[userid: number, slot: number]>(),
		SendMessage: Definitions.BidirectionalEvent<
			[text: string, color?: Color3, duration?: number],
			[text: string, color?: Color3, duration?: number]
		>(),
		Restart: Definitions.ClientToServerEvent<[]>(),
	}),
	ServerRestartProgress: Definitions.ServerToClientEvent<[atmosphereColor: number]>(),
});
