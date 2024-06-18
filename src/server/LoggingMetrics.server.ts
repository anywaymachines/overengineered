import { Players, RunService } from "@rbxts/services";
import { DiscordWebhook } from "server/DiscordWebhook";
import { GameDefinitions } from "shared/data/GameDefinitions";

namespace LoggingMetrics {
	const storage: string[] = [];

	export function initialize() {
		if (RunService.IsStudio()) return;

		// Players
		Players.PlayerAdded.Connect((plr) => {
			addLine(`[**@${plr.Name}**](https://www.roblox.com/users/${plr.UserId}/profile) joined the game`);

			plr.Chatted.Connect((message, recipient) => {
				addLine(
					`[**@${plr.Name}**](https://www.roblox.com/users/${plr.UserId}/profile) chatted \`${message}\`` +
						(recipient
							? ` to [**@${recipient!.Name}**](https://www.roblox.com/users/${recipient!.UserId}/profile)`
							: ""),
				);
			});
		});
		Players.PlayerRemoving.Connect((plr) =>
			addLine(`[**@${plr.Name}**](https://www.roblox.com/users/${plr.UserId}/profile) left the game`),
		);

		// Send every 2 mins
		task.spawn(() => {
			while (true as boolean) {
				task.wait(120);
				sendMetrics();
			}
		});

		// Send on close
		game.BindToClose(() => {
			addLine(`\n**SERVER CLOSED**`);
			sendMetrics();
		});
	}

	export function addLine(text: string) {
		storage.push(text);
	}

	function sendMetrics() {
		if (storage.size() === 0) return;

		const content = storage.join("\n");

		DiscordWebhook.sendMessage({
			embeds: [
				{
					description: content,
					title: GameDefinitions.isTestPlace() ? "⚠️ Internal" : "✅ Production",
					url: `https://www.roblox.com/games/start?placeId=16302670534&launchData=${game.PlaceId}/${game.JobId}`,
					color: 0,
					timestamp: DateTime.now().ToIsoDate(),
					footer: {
						text:
							`🔨 Build ${game.PlaceVersion}` +
							(game.PrivateServerOwnerId !== 0 ? ", Private Server" : "") +
							` (${game.JobId.sub(game.JobId.size() - 4)})`,
					},
				},
			],
		});

		storage.clear();
	}
}

LoggingMetrics.initialize();
