import { RunService, Workspace } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";
import { LocalPlayerController } from "./LocalPlayerController";

export namespace GameEnvironmentController {
	export let currentHeight = 0;

	export function initialize() {
		RunService.Heartbeat.Connect(update);
	}

	export function update() {
		if (!LocalPlayerController.rootPart) return;

		const position = LocalPlayerController.rootPart.Position;
		currentHeight = position.Y - GameDefinitions.HEIGHT_OFFSET;

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
