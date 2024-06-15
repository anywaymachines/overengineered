import { HttpService, Workspace } from "@rbxts/services";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class CameraController extends HostedService {
	constructor(@inject playerData: PlayerDataStorage) {
		super();

		this.event.subscribeObservable(
			playerData.config.createBased((x) => x.betterCamera),
			(betterCamera) => {
				$log("better_camera set to " + HttpService.JSONEncode(betterCamera));
				Workspace.SetAttribute("camera_improved", betterCamera?.improved === true);
				Workspace.SetAttribute("camera_playerCentered", betterCamera?.playerCentered === true);
				Workspace.SetAttribute("camera_strictFollow", betterCamera?.strictFollow === true);
			},
			true,
		);
	}
}
