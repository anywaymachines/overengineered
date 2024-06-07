import { RunService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { GameEnvironment } from "shared/data/GameEnvironment";

export namespace GameEnvironmentController {
	export function initialize() {
		RunService.Heartbeat.Connect(update);
	}

	export function update() {
		const playerHeight = LocalPlayer.getPlayerRelativeHeight();

		Workspace.AirDensity = math.max(
			GameEnvironment.EarthAirDensity -
				playerHeight * (GameEnvironment.EarthAirDensity / GameEnvironment.ZeroAirHeight),
		);
		Workspace.Gravity = math.max(
			GameEnvironment.EarthGravity -
				playerHeight * (GameEnvironment.EarthGravity / GameEnvironment.ZeroGravityHeight),
			0,
		);
	}
}
