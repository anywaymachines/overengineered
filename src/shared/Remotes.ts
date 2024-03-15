import Net from "@rbxts/net";
import { PlacedBlockConfig, PlacedBlockLogicConnections } from "shared/building/BlockManager";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel }>;
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
		readonly blocks: BlockList;
		readonly diff: Vector3;
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
}

const Remotes = Net.Definitions.Create({
	Player: Net.Definitions.Namespace({
		InputTypeInfo: Net.Definitions.ClientToServerEvent<[inputType: InputType]>(),
		UpdateSettings:
			Net.Definitions.ServerAsyncFunction<
				<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey]) => Response
			>(),
		FetchData: Net.Definitions.ServerAsyncFunction<() => PlayerDataResponse>(),
	}),
	Building: Net.Definitions.Namespace({
		UpdateConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),
		ResetConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigResetRequest) => Response>(),

		PlaceBlocks: Net.Definitions.ServerAsyncFunction<(data: PlaceBlocksRequest) => MultiBuildResponse>(),
		DeleteBlocks: Net.Definitions.ServerAsyncFunction<(data: DeleteBlocksRequest) => Response>(),
		MoveBlocks: Net.Definitions.ServerAsyncFunction<(data: MoveBlocksRequest) => Response>(),
		LogicConnect: Net.Definitions.ServerAsyncFunction<(data: LogicConnectRequest) => Response>(),
		LogicDisconnect: Net.Definitions.ServerAsyncFunction<(data: LogicDisconnectRequest) => Response>(),
		PaintBlocks: Net.Definitions.ServerAsyncFunction<(data: PaintBlocksRequest) => Response>(),
	}),
	Slots: Net.Definitions.Namespace({
		Load: Net.Definitions.ServerAsyncFunction<(index: number) => LoadSlotResponse>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 8 }),
		]),
		Save: Net.Definitions.ServerAsyncFunction<(data: PlayerSaveSlotRequest) => SaveSlotResponse>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 60 }),
		]),
	}),
	Ride: Net.Definitions.Namespace({
		SetPlayMode: Net.Definitions.ServerAsyncFunction<(mode: PlayModes) => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 30 }),
		]),
		SetPlayModeOnClient: Net.Definitions.ClientAsyncFunction<(mode: PlayModes | undefined) => Response>(),
		Sit: Net.Definitions.ClientToServerEvent<[]>(),
	}),
	Debug: Net.Definitions.Namespace({
		DisplayLine: Net.Definitions.ServerToClientEvent<[text: string, isClient: boolean, isError: boolean]>(),
	}),
	Admin: Net.Definitions.Namespace({
		LoadSlot: Net.Definitions.ClientToServerEvent<[userid: number, slot: number]>(),
		SendMessage: Net.Definitions.BidirectionalEvent<[text: string], [text: string]>(),
	}),
});
export default Remotes;
