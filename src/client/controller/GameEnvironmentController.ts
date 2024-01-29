import { RunService, Workspace } from "@rbxts/services";
import PlayerController from "client/PlayerController";

export default class GameEnvironmentController {
	// Const
	public static readonly EarthGravity = 180;
	public static readonly EarthAirDensity = 0.2;

	public static readonly ZeroGravityHeight = 15000;
	public static readonly ZeroAirHeight = 10000;

	public static readonly MinSoundValue = 0.01;

	// Vars
	public static currentHeight = 0;

	public static initialize() {
		RunService.Heartbeat.Connect(() => this.update());
	}

	public static update() {
		if (!PlayerController.humanoidRootPart) return;

		let position = PlayerController.humanoidRootPart.Position;

		if (position.Y <= 0) {
			position = new Vector3(0, 1, 0);
		}

		this.currentHeight = position.Y;

		Workspace.AirDensity = math.max(
			this.EarthAirDensity - this.currentHeight * (this.EarthAirDensity / this.ZeroAirHeight),
		);
		Workspace.Gravity = math.max(
			this.EarthGravity - this.currentHeight * (this.EarthGravity / this.ZeroGravityHeight),
			0,
		);
	}
}
