import Net from "@rbxts/net";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel }>;
	type MultiBuildResponse = Response<{ readonly models: readonly BlockModel[] }>;

	interface PlaceBlockByPlayerRequest {
		readonly id: string;
		readonly color: Color3;
		readonly material: Enum.Material;
		readonly location: CFrame;
	}
	interface PlaceBlockByServerRequest extends PlaceBlockByPlayerRequest {
		readonly uuid: string;
		readonly config: Readonly<Record<string, string>>;
	}

	interface PlaceBlocksByPlayerRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly PlaceBlockByPlayerRequest[];
	}
	interface PlaceBlocksByServerRequest {
		readonly plot: PlotModel;
		readonly blocks: readonly PlaceBlockByServerRequest[];
	}

	interface MoveBlocksRequest {
		readonly plot: PlotModel;
		readonly blocks: BlockList;
		readonly diff: Vector3;
	}

	interface LogicConnectRequest {
		readonly outputBlock: BlockModel;
		readonly outputConnection: BlockConnectionName;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	}
	interface LogicDisconnectRequest {
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
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
		MoveRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => Response>(),

		UpdateConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),

		/** @deprecated */
		UpdateLogicConnectionRequest:
			Net.Definitions.ServerAsyncFunction<(data: UpdateLogicConnectionRequest) => Response>(),

		PlaceBlocks: Net.Definitions.ServerAsyncFunction<(data: PlaceBlocksByPlayerRequest) => MultiBuildResponse>(),
		MoveBlocks: Net.Definitions.ServerAsyncFunction<(data: MoveBlocksRequest) => Response>(),
		LogicConnect: Net.Definitions.ServerAsyncFunction<(data: LogicConnectRequest) => Response>(),
		LogicDisconnect: Net.Definitions.ServerAsyncFunction<(data: LogicDisconnectRequest) => Response>(),

		Delete: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => Response>(),
		Paint: Net.Definitions.ServerAsyncFunction<(data: PaintRequest) => Response>(),
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
