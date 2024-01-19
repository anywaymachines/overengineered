import { HttpService } from "@rbxts/services";

export default class DiscordWebhook {
	private static webhook =
		"https://discord.com/api/webhooks/1197990614671822999/kTKPwZN1p9sJQYLw7L4-jO3Au2LH6ffXxtJjNoLTZljuScGTpaVr9-hgVmGoq08IcfAV";

	static log(text: string) {
		const data = HttpService.JSONEncode({ content: `\`[INFO] ${text}\`` });

		HttpService.PostAsync(this.webhook, data);
	}

	static important(text: string) {
		const data = HttpService.JSONEncode({ content: `<@1049428656285548564> \`[IMPORTANT] ${text}\`` });

		HttpService.PostAsync(this.webhook, data);
	}
}
