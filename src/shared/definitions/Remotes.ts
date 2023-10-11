import Net, { Definitions } from "@rbxts/net";

const Remotes = Net.CreateDefinitions({
	// Definitions for the actual remotes will go here
	//PlayerPlaceBlock: Definitions.ClientToServerEvent<[blockId: string, location: CFrame]>(),
	PlayerPlaceBlock: Definitions.ServerAsyncFunction<(arg0: PlayerPlaceBlockRequest) => PlayerPlaceBlockResponse>(),
});

export = Remotes;
