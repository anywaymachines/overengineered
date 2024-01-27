import { Players, RunService, Workspace } from "@rbxts/services";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";

export default class GameEnvironmentController {
	// Const
	public static readonly EarthGravity = 180;
	public static readonly EarthAirDensity = 0.2;

	public static readonly ZeroGravityHeight = 15000;
	public static readonly ZeroAirHeight = 10000;

	public static readonly MinSoundValue = 0.01;

	// Vars
	public static currentHeight = 0;
	private static hrp: Part;

	private static eventHandler = new EventHandler();

	public static initialize() {
		this.eventHandler.subscribe(Signals.PLAYER.SPAWN, () => {
			Players.LocalPlayer.CharacterAppearanceLoaded.Wait();
			this.hrp = Players.LocalPlayer.Character!.WaitForChild("HumanoidRootPart") as Part;
		});

		this.eventHandler.subscribe(RunService.Heartbeat, () => this.update());
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
