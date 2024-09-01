import { MessagingService, RunService } from "@rbxts/services";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { registerOnRemoteEvent } from "server/network/event/RemoteHandler";
import { HostedService } from "shared/GameHost";
import { Remotes } from "shared/Remotes";

export class GlobalMessageController extends HostedService {
	constructor() {
		super();

		this.onEnable(() => {
			if (!RunService.IsStudio()) {
				task.spawn(() => {
					this.event.eventHandler.register(
						MessagingService.SubscribeAsync("global_message", (message) => {
							const msg = message as unknown as { text: string; color: Color3; duration: number };
							Remotes.Server.GetNamespace("Admin")
								.Get("SendMessage")
								.SendToAllPlayers(msg.text, msg.color, msg.duration);
						}),
					);
				});
			}
		});

		registerOnRemoteEvent("Admin", "SendMessage", this.sendMessageAsAdmin.bind(this));
	}

	private sendMessageAsAdmin(player: Player, text: string, color?: Color3, duration?: number) {
		if (isNotAdmin_AutoBanned(player, "globalMessage")) {
			return;
		}

		task.spawn(() => {
			MessagingService.PublishAsync("global_message", {
				text: text,
				color: color,
				duration: duration,
			});
		});

		Remotes.Server.GetNamespace("Admin").Get("SendMessage").SendToAllPlayers(text, color, duration);
	}
}
