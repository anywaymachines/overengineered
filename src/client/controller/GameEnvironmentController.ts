import { RunService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";

export namespace GameEnvironmentController {
	export let currentHeight = 0;

	export function initialize() {
		RunService.Heartbeat.Connect(update);
	}

	export function update() {
		const rootPart = LocalPlayer.rootPart.get();
		if (!rootPart) return;

		const position = rootPart.Position;
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
