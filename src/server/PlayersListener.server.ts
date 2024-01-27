import { Players, RunService } from "@rbxts/services";
import DiscordWebhook from "./DiscordWebhook";

if (!RunService.IsStudio()) {
	const banlist: { [key: number]: string } = {
		309545016: "apologize and tell me why you did it", // chiseled_cheese
		19823479: "apologize", // rickje139
	};

	Players.PlayerAdded.Connect((player) => {
		if (banlist[player.UserId] !== undefined) {
			player.Kick(banlist[player.UserId]);
			DiscordWebhook.log(`${player.Name} tried to join but was kicked by AntiRickje protection`);
			return;
		}

		DiscordWebhook.log(`${player.Name} joined to "${game.JobId}"`);
	});

	Players.PlayerRemoving.Connect((player) => {
		DiscordWebhook.log(`${player.Name} left from "${game.JobId}"`);
	});
}
