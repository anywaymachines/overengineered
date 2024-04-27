import { HttpService } from "@rbxts/services";
import { Logger } from "shared/Logger";

const logger = new Logger("DiscordWebhook");

export namespace DiscordWebhook {
	const webhook =
		"https://webhook.lewisakura.moe/api/webhooks/1197990614671822999/kTKPwZN1p9sJQYLw7L4-jO3Au2LH6ffXxtJjNoLTZljuScGTpaVr9-hgVmGoq08IcfAV";

	function request(data: string) {
		try {
			HttpService.PostAsync(webhook, data);
		} catch (error) {
			logger.error("Discord logging failed");
		}
	}

	export function log(text: string) {
		const data = HttpService.JSONEncode({ content: `\`[INFO] ${text}\`` });

		request(data);
	}

	export function important(text: string) {
		const data = HttpService.JSONEncode({ content: `<@1049428656285548564> \`[IMPORTANT] ${text}\`` });

		request(data);
	}
}
