import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Building: Net.Definitions.Namespace({
		PlayerPlaceBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerPlaceBlockRequest) => BuildResponse>(),
		PlayerDeleteBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
		PlayerClearAll: Net.Definitions.ServerAsyncFunction<() => BuildResponse>(),
		PlayerMove: Net.Definitions.ServerAsyncFunction<(data: PlayerMoveRequest) => BuildResponse>(),
	}),
	Ride: Net.Definitions.Namespace({
		RideStart: Net.Definitions.ServerAsyncFunction<() => void>(),
	}),
});

export default Remotes;
