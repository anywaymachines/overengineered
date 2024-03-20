import { RunService, Workspace } from "@rbxts/services";
import GameEnvironment from "shared/data/GameEnvironment";
import LocalPlayerController from "./LocalPlayerController";

export default class GameEnvironmentController {
	static currentHeight = 0;

	static initialize() {
		RunService.Heartbeat.Connect(() => this.update());
	}

	static update() {
		if (!LocalPlayerController.rootPart) return;

		let position = LocalPlayerController.rootPart.Position;

		if (position.Y <= 0) {
			position = new Vector3(0, 1, 0);
		}

		this.currentHeight = position.Y;

		Workspace.AirDensity = math.max(
			GameEnvironment.EarthAirDensity -
				this.currentHeight * (GameEnvironment.EarthAirDensity / GameEnvironment.ZeroAirHeight),
		);
		Workspace.Gravity = math.max(
			GameEnvironment.EarthGravity -
				this.currentHeight * (GameEnvironment.EarthGravity / GameEnvironment.ZeroGravityHeight),
			0,
		);
	}
}
