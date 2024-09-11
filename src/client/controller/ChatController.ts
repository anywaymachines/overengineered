import { TextChatService, Players } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace ChatController {
	export function initializeAdminPrefix() {
		TextChatService.OnIncomingMessage = function (message: TextChatMessage) {
			const props = new Instance("TextChatMessageProperties");

			if (message.TextSource) {
				const player = Players.GetPlayerByUserId(message.TextSource.UserId);

				if (player && GameDefinitions.isAdmin(player)) {
					/*
						Sponsored by:
						- is maks owner?
						- no i dont think so
					*/
					props.PrefixText =
						`<font color='#ff5555'>[${player.Name === "3QAXM" ? "Founder" : "Developer"}]</font> ` +
						message.PrefixText;

					props.Text = `<b>` + message.Text + `</b>`;
				}

				props.Text = props.Text.gsub(
					"plane crazy",
					`<font transparency="0.6">plane crazy <u>(poor game)</u></font>`,
				)[0];
				props.Text = props.Text.gsub("ripoff", `<font transparency="0.6">ripoff <u>(no you)</u></font>`)[0];
			}

			return props;
		};
	}
}
