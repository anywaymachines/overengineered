import { Players, RunService, Workspace } from "@rbxts/services";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";

export default class GameEnvironmentController {
	// Const
	public static readonly NoSoundHeight = 10000;
	public static readonly MinSoundValue = 0.005;
	public static readonly WeightlessnessHeight = 15000;
	public static readonly NormalGravity = 180;
	public static readonly NoGravityGravity = 0.001;

	// Vars
	public static currentHeight = 0;
	private static hrp: Part;

	private static eventHandler = new EventHandler();

	public static initialize() {
		this.eventHandler.subscribe(Signals.PLAYER.SPAWN, () => {
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

		Workspace.Gravity = math.max(
			this.NormalGravity - this.currentHeight * (this.NormalGravity / this.WeightlessnessHeight),
			this.NoGravityGravity,
		);
	}
}
