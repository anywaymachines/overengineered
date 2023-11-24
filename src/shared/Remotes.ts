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
	Ride: Net.Definitions.Namespace({
		RideStartRequest: Net.Definitions.ServerAsyncFunction<() => void>(),
	}),
});

export default Remotes;
