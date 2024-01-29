import { Players, RunService, Workspace } from "@rbxts/services";
import Signals from "client/event/Signals";

export default class GameEnvironmentController {
	// Const
	public static readonly EarthGravity = 180;
	public static readonly EarthAirDensity = 0.2;

	public static readonly ZeroGravityHeight = 15000;
	public static readonly ZeroAirHeight = 10000;

	public static readonly MinSoundValue = 0.01;

	// Vars
	public static currentHeight = 0;
	private static hrp: BasePart;

	public static initialize() {
		Signals.PLAYER.SPAWN.Connect(() => {
			this.hrp = Players.LocalPlayer.Character!.FindFirstChild("HumanoidRootPart") as BasePart;
		});

		RunService.Heartbeat.Connect(() => this.update());
	}

	public static update() {
		if (!this.hrp) return;

		let position = this.hrp.Position;

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
