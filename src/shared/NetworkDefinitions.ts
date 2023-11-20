import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Building: Net.Definitions.Namespace({
		PlaceBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlaceBlockRequest) => BuildResponse>(),
		DeleteBlockRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
		ClearAllRequest: Net.Definitions.ServerAsyncFunction<() => BuildResponse>(),
		MoveRequest: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => BuildResponse>(),

		WeldBlock: Net.Definitions.ServerToClientEvent<[model: Model]>(),
	}),
	Ride: Net.Definitions.Namespace({
		RideStartRequest: Net.Definitions.ServerAsyncFunction<() => void>(),
	}),
});

export default Remotes;
