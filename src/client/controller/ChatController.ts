import { TextChatService, Players } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace ChatController {
	export function initializeAdminPrefix() {
		TextChatService.OnIncomingMessage = function (message: TextChatMessage) {
			const props = new Instance("TextChatMessageProperties");

			if (message.TextSource) {
				const player = Players.GetPlayerByUserId(message.TextSource.UserId);

				if (player && GameDefinitions.isAdmin(player)) {
					props.PrefixText = `<font color='#ff5555'>[Developer]</font> ` + message.PrefixText;
				}
			}

			return props;
		};
	}
}
