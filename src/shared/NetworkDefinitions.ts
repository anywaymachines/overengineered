import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	Building: Net.Definitions.Namespace({
		PlayerPlaceBlock:
			Net.Definitions.ServerAsyncFunction<(data: PlayerPlaceBlockRequest) => PlayerPlaceBlockResponse>(),
	}),
});

export default Remotes;
