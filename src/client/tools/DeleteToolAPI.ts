import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";

export default class DeleteToolAPI {
	private gameUI: GameUI;

	// Player
	private LocalPlayer: Player;
	private Mouse: Mouse;

	// Event
	private mouseClickEvent: RBXScriptConnection | undefined;
	private mouseMoveEvent: RBXScriptConnection | undefined;

	// Variables
	private blockHighlight: Highlight | undefined;

	constructor(gameUI: GameUI) {
		this.gameUI = gameUI;

		this.LocalPlayer = Players.LocalPlayer;
		this.Mouse = this.LocalPlayer.GetMouse();
	}

	public equip() {
		// Events
		this.mouseClickEvent = this.Mouse.Button1Down.Connect(async () => this.onMouseClick());
		this.mouseMoveEvent = this.Mouse.Move.Connect(() => this.onMouseMove());
	}

	public async onMouseClick() {
		// No block selected
		if (this.blockHighlight === undefined) {
			return;
		}

		const response = await Remotes.Client.GetNamespace("Building")
			.Get("PlayerDeleteBlock")
			.CallServerAsync({
				block: this.blockHighlight.Parent as Model,
			});

		if (response.success) {
			task.wait();
		} else {
			Logger.info("[DELETING] Block deleting failed: " + response.message);
		}
	}

	public onMouseMove() {
		const target = this.Mouse.Target;

		if (this.blockHighlight !== undefined) {
			this.blockHighlight.Destroy();
		}

		// Mouse is in space
		if (target === undefined) {
			return;
		}

		// Skip useless parts
		if (target.Parent === undefined || !target.IsDescendantOf(Workspace.Plots)) {
			return;
		}

		const parentPlot = SharedPlots.getPlotByBlock(target.Parent as Model);

		// No plot?
		if (parentPlot === undefined) {
			return;
		}

		// Plot is forbidden
		if (!BuildingManager.isBuildingAllowed(parentPlot, this.LocalPlayer)) {
			return;
		}

		this.blockHighlight = new Instance("Highlight");
		this.blockHighlight.Parent = target.Parent;
		this.blockHighlight.Adornee = target.Parent;
	}

	public unequip() {
		if (this.blockHighlight !== undefined) {
			this.blockHighlight.Destroy();
		}

		this.mouseClickEvent?.Disconnect();
		this.mouseMoveEvent?.Disconnect();
	}
}
