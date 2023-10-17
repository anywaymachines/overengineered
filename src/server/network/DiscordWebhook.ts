import { HttpService } from "@rbxts/services";

export default class DiscordWebhook {
	public static webhookURL: string =
		"https://discord.com/api/webhooks/1163794561936674816/g_ejw-IFcRb7bi-xLrRhGtOB5ishLybb0oqaF3lPJZBxXInXW0r6mkGRRHu3nFq2KGqW";

	public static send(msg: string) {
		const data = { content: msg };
		HttpService.PostAsync(this.webhookURL, HttpService.JSONEncode(data));
	}
}
