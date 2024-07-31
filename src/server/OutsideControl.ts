import { MessagingService, Players, RunService } from "@rbxts/services";

export namespace OutsideControl {
	export function initialize() {
		if (RunService.IsStudio()) return;

		task.spawn(() => {
			MessagingService.SubscribeAsync("kick", (raw) => {
				const data = raw as unknown as { username: string; reason?: string };

				const plr = Players.GetPlayers().find((value) => value.Name === data.username);
				if (plr) {
					plr.Kick(data.reason);
				}
			});
		});
	}
}
