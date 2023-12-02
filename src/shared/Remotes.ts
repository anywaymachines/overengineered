import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Player: Net.Definitions.Namespace({
		InputTypeInfo: Net.Definitions.ClientToServerEvent<[inputType: InputType]>(),
	}),
	Building: Net.Definitions.Namespace({
		PlaceBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlaceBlockRequest) => BuildResponse>(),
		MoveRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => BuildResponse>(),

		UpdateConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),

		Delete: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
	}),
	Slots: Net.Definitions.Namespace({
		Fetch: Net.Definitions.ServerAsyncFunction<() => FetchSlotsResponse>(),
		Load: Net.Definitions.ServerAsyncFunction<(index: number) => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 8 }),
		]),
		Save: Net.Definitions.ServerAsyncFunction<(data: PlayerSaveSlotRequest) => Response & { blocks?: number }>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 60 }),
		]),
	}),
	Ride: Net.Definitions.Namespace({
		SetPlayMode: Net.Definitions.ServerAsyncFunction<(mode: PlayModes) => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 30 }),
		]),
		SetPlayModeOnClient: Net.Definitions.ClientAsyncFunction<(mode: PlayModes | undefined) => Response>(),
	}),
	Blocks: Net.Definitions.Namespace({
		DisconnectBlock: Net.Definitions.Namespace({
			Disconnect: Net.Definitions.ClientToServerEvent<[block: Model]>(),
		}),
	}),
});

export default Remotes;
