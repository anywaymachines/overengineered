import { Base64 } from "@rbxts/crypto";
import { HttpService, Players, RunService } from "@rbxts/services";
import { DiscordWebhook } from "server/DiscordWebhook";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BootFlag } from "server/BootFlagsController";

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

		addLine("**SERVER STARTED**\n");
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
					title: GameDefinitions.isTestPlace() ? "⚠️ Internal" : undefined,
					color: 0,
					timestamp: DateTime.now().ToIsoDate(),
					author: {
						name: "JOIN",
						url: `https://www.roblox.com/games/start?placeId=${game.PlaceId}&launchData=${Base64.Encode(HttpService.JSONEncode({ task: 0, jobId: game.JobId } as BootFlag))}`,
					},
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
