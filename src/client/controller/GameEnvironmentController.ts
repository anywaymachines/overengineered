import { Players, RunService, Workspace } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import PlayModeController from "./PlayModeController";
import EventHandler from "shared/event/EventHandler";
import Signals from "client/event/Signals";

export default class GameEnvironmentController {
	private static readonly plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);

	// Const
	public static readonly WeightlessnessHeight = 10000;
	public static readonly NormalGravity = 192.2;
	public static readonly NoGravityGravity = 0;

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
