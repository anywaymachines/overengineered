import { Players, RunService } from "@rbxts/services";
import { Colors } from "shared/Colors";
import { DiscordWebhook } from "./DiscordWebhook";

if (!RunService.IsStudio()) {
	Players.PlayerAdded.Connect((player) => {
		DiscordWebhook.sendMessage({
			embeds: [
				{
					title: `${player.DisplayName} (@${player.Name})`,
					description: "Joined the game",
					url: `https://www.roblox.com/users/${player.UserId}/profile`,
					color: Colors.colorToNumber(Colors.white),
					timestamp: DateTime.now().ToIsoDate(),
				},
			],
			username: "Join / Leave",
		});

		player.Chatted.Connect((message, recipient) => {
			DiscordWebhook.sendMessage({
				embeds: [
					{
						title: `${player.DisplayName} (@${player.Name})`,
						description: `Sent chat message`,
						fields: [
							{
								name: "Message",
								value: `\` ${message} \``,
								inline: true,
							},
							{
								name: "Recipient",
								value: recipient ? `\` ${recipient.DisplayName} (@${recipient.Name}) \`` : "` All `",
								inline: true,
							},
						],
						color: Colors.colorToNumber(Colors.black),
						timestamp: DateTime.now().ToIsoDate(),
					},
				],
				username: "Chat",
			});
		});
	});

	Players.PlayerRemoving.Connect((player) => {
		DiscordWebhook.sendMessage({
			embeds: [
				{
					title: `${player.DisplayName} (@${player.Name})`,
					description: "Left the game",
					url: `https://www.roblox.com/users/${player.UserId}/profile`,
					color: Colors.colorToNumber(Colors.red),
					timestamp: DateTime.now().ToIsoDate(),
				},
			],
			username: "Join / Leave",
		});
	});
}
