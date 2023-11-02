import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Building: Net.Definitions.Namespace({
		PlayerPlaceBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerPlaceBlockRequest) => BuildResponse>(),
		PlayerDeleteBlock: Net.Definitions.ServerAsyncFunction<(data: PlayerDeleteBlockRequest) => BuildResponse>(),
		PlayerClearAll: Net.Definitions.ServerAsyncFunction<() => BuildResponse>(),
	}),
});

export default Remotes;
