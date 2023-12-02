import { Players, RunService, Workspace } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import PlayModeController from "./PlayModeController";
import EventHandler from "shared/event/EventHandler";

export default class GameEnvironmentController {
	private static readonly plot = SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId);
	private static blocks: Model;
	private static mode = PlayModeController.instance.playmode;

	// Const
	public static readonly WeightlessnessHeight = 10000;
	public static readonly NormalGravity = 192.2;
	public static readonly NoGravityGravity = 0;

	// Vars
	public static currentHeight = 0;

	private static eventHandler = new EventHandler();

	public static initialize() {
		this.mode.subscribe((value, prev) => {
			if (value === "ride") {
				this.blocks = this.plot.FindFirstChild("Blocks") as Model;
				this.eventHandler.subscribe(RunService.Heartbeat, () => this.update());
			} else {
				this.eventHandler.unsubscribeAll();

				// Reset all
				Workspace.Gravity = this.NormalGravity;
			}
		});
	}

	public static update() {
		let position = this.blocks.GetBoundingBox()[0].Position;

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
