import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Building: Net.Definitions.Namespace({
		PlayerPlaceBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerPlaceBlockRequest) => BuildResponse>(),
		PlayerDeleteBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
		PlayerClearAll: Net.Definitions.ServerAsyncFunction<() => BuildResponse>(),
	}),
	Ride: Net.Definitions.Namespace({
		RideStart: Net.Definitions.ServerAsyncFunction<() => void>(),
	}),
});

// Building timeouts
Remotes.Client.GetNamespace("Building").Get("PlayerPlaceBlock").SetCallTimeout(0.05);
Remotes.Client.GetNamespace("Building").Get("PlayerDeleteBlock").SetCallTimeout(0.05);
Remotes.Client.GetNamespace("Building").Get("PlayerClearAll").SetCallTimeout(10);

// Ride timeouts
Remotes.Client.GetNamespace("Ride").Get("RideStart").SetCallTimeout(10);

export default Remotes;
