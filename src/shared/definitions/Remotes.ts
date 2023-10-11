import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	// Definitions for the actual remotes will go here
	//PlayerPlaceBlock: Definitions.ClientToServerEvent<[blockId: string, location: CFrame]>(),
	Building: Net.Definitions.Namespace({
		PlayerPlaceBlock:
			Net.Definitions.ServerAsyncFunction<(data: PlayerPlaceBlockRequest) => PlayerPlaceBlockResponse>(),
	}),
});

export default Remotes;
