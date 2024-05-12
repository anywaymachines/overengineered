import { HttpService } from "@rbxts/services";

type Field = {
	name: string;
	value: string;
	inline?: boolean;
};

type Author = {
	name: string;
	url?: string;
	icon_url?: string;
};

type Embed = {
	title?: string;
	description?: string;
	color: number;
	url?: string;
	author?: Author;
	timestamp?: string;
	fields?: readonly Field[];
};

type Message = {
	content?: string;
	embeds: readonly Embed[];
	username?: string;
};

export namespace DiscordWebhook {
	const webhook =
		"https://webhook.lewisakura.moe/api/webhooks/1197990614671822999/kTKPwZN1p9sJQYLw7L4-jO3Au2LH6ffXxtJjNoLTZljuScGTpaVr9-hgVmGoq08IcfAV";

	export function sendMessage(message: Message) {
		message = {
			...message,
			embeds: message.embeds.map((e) => ({
				...e,
				author: e.author ?? {
					name: "Click to join",
					url: `https://www.roblox.com/games/start?placeId=16302670534&launchData=${game.PlaceId}/${game.JobId}`,
				},
			})),
		};

		request(HttpService.JSONEncode(message));
	}

	function request(data: string) {
		try {
			HttpService.PostAsync(webhook, data);
		} catch (error) {
			$err("Discord logging failed");
		}
	}
}
