import { Base64 } from "@rbxts/crypto";
import { HttpService, Players, TeleportService } from "@rbxts/services";

type BootFlags = {
	task: 0; // Join to job id
	jobId: string;
};

export namespace BootFlagsController {
	export function initialize() {
		Players.PlayerAdded.Connect((player) => {
			const rawData = player.GetJoinData().LaunchData;
			if (!rawData) return;

			const launchData = HttpService.JSONDecode(Base64.Decode(rawData)) as BootFlags;

			if (launchData.task === 0) {
				TeleportService.TeleportToPlaceInstance(game.PlaceId, launchData.jobId, player);
			}
		});
	}
}
