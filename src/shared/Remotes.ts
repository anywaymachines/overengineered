import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Player: Net.Definitions.Namespace({
		InputTypeInfo: Net.Definitions.ClientToServerEvent<[inputType: InputType]>(),
	}),
	Building: Net.Definitions.Namespace({
		PlaceBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlaceBlockRequest) => BuildResponse>(),
		DeleteBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
		ClearAllRequest: Net.Definitions.ServerAsyncFunction<() => BuildResponse>(),
		MoveRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => BuildResponse>(),

		UpdateConfigRequest: Net.Definitions.ServerAsyncFunction<(data: ConfigUpdateRequest) => Response>(),
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
		RideStartRequest: Net.Definitions.ServerAsyncFunction<() => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 2 }),
		]),
		RideStopRequest: Net.Definitions.ServerAsyncFunction<() => Response>([
			Net.Middleware.RateLimit({ MaxRequestsPerMinute: 2 }),
		]),
	}),
	Blocks: Net.Definitions.Namespace({
		DisconnectBlock: Net.Definitions.Namespace({
			Disconnect: Net.Definitions.ClientToServerEvent<[block: Model]>(),
		}),
	}),
});

export default Remotes;
