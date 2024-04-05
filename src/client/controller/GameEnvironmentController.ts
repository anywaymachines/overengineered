import { RunService, Workspace } from "@rbxts/services";
import { GameEnvironment } from "shared/data/GameEnvironment";
import { LocalPlayerController } from "./LocalPlayerController";

export namespace GameEnvironmentController {
	export let currentHeight = 0;

	export function initialize() {
		RunService.Heartbeat.Connect(update);
	}

	export function update() {
		if (!LocalPlayerController.rootPart) return;

		let position = LocalPlayerController.rootPart.Position;

		if (position.Y <= 0) {
			position = new Vector3(0, 1, 0);
		}

		currentHeight = position.Y;

		Workspace.AirDensity = math.max(
			GameEnvironment.EarthAirDensity -
				currentHeight * (GameEnvironment.EarthAirDensity / GameEnvironment.ZeroAirHeight),
		);
		Workspace.Gravity = math.max(
			GameEnvironment.EarthGravity -
				currentHeight * (GameEnvironment.EarthGravity / GameEnvironment.ZeroGravityHeight),
			0,
		);
	}
}
