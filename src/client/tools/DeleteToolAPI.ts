import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";

export default class DeleteToolAPI extends AbstractToolAPI {
	// Variables
	private blockHighlight: Highlight | undefined;

	constructor(gameUI: MyGui) {
		super(gameUI);
	}

	public equip() {
		// Events
		this.eventHandler.registerEvent(this.mouse.Button1Down, () => this.onMouseClick());
		this.eventHandler.registerEvent(this.mouse.Move, () => this.onMouseMove());
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

	public onUserInput(input: InputObject): void {
		// TODO: Implement
	}
	public onPlatformChanged(): void {
		// TODO: Implement
	}

	public onMouseMove() {
		const target = this.mouse.Target;

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
		if (!BuildingManager.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
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
	}
}
