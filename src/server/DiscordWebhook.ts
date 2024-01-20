import { HttpService } from "@rbxts/services";
import Logger from "shared/Logger";

export default class DiscordWebhook {
	private static webhook =
		"https://webhook.lewisakura.moe/api/webhooks/1197990614671822999/kTKPwZN1p9sJQYLw7L4-jO3Au2LH6ffXxtJjNoLTZljuScGTpaVr9-hgVmGoq08IcfAV";

	private static request(data: string) {
		try {
			HttpService.PostAsync(this.webhook, data);
		} catch (error) {
			Logger.error("Discord logging failed");
		}
	}

	static log(text: string) {
		const data = HttpService.JSONEncode({ content: `\`[INFO] ${text}\`` });

		this.request(data);
	}

	static important(text: string) {
		const data = HttpService.JSONEncode({ content: `<@1049428656285548564> \`[IMPORTANT] ${text}\`` });

		this.request(data);
	}
}
