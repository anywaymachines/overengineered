import { MessagingService } from "@rbxts/services";
import Remotes from "shared/Remotes";

MessagingService.SubscribeAsync("broadcast", (data) => {
	Remotes.Server.GetNamespace("Player")
		.Get("SendChatMessage")
		.SendToAllPlayers("[SERVER] " + data.Data, Color3.fromRGB(255, 184, 51));
});
