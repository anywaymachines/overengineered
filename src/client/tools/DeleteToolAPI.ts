import { Players, Workspace } from "@rbxts/services";
import Logger from "shared/Logger";
import Remotes from "shared/NetworkDefinitions";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";
import GameControls from "client/GameControls";
import PlayerUtils from "shared/utils/PlayerUtils";
import GuiUtils from "client/utils/GuiUtils";
import GuiAnimations from "client/gui/GuiAnimations";

export default class DeleteToolAPI extends AbstractToolAPI {
	// Variables
	public blockHighlight: Highlight | undefined;

	constructor(gameUI: MyGui) {
		super(gameUI);
	}

	public equip() {
		super.equip();

		this.updateMobileButtons();
	}

	public async deleteBlock() {
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

			this.gameUI.Sounds.Building.BlockDelete.PlaybackSpeed = math.random(8, 12) / 10; // Give some randomness
			this.gameUI.Sounds.Building.BlockDelete.Play();

			this.blockHighlight = undefined;

			this.updateMobileButtons();
		} else {
			Logger.info("[DELETING] Block deleting failed: " + response.message);
		}
	}

	public onUserInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			if (input.KeyCode === Enum.KeyCode.ButtonX) {
				this.deleteBlock();
			}
		} else if (input.UserInputType === Enum.UserInputType.Touch) {
			this.updatePosition();
		}
	}

	public onPlatformChanged(): void {
		super.onPlatformChanged();

		// The best way at the moment
		this.removeHighlight();

		this.setupEvents();
	}

	public setupEvents() {
		Logger.info("[DeleteToolAPI] Setting up events");

		const platform = GameControls.getPlatform();
		if (platform === "Mobile") {
			this.eventHandler.registerEvent(this.gameUI.DeleteToolMobile.DeleteButton.MouseButton1Click, () =>
				this.deleteBlock(),
			);
		} else {
			if (platform === "Desktop") {
				this.eventHandler.registerEvent(this.mouse.Button1Down, () => this.deleteBlock());
				this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
			} else if (platform === "Console") {
				this.eventHandler.registerEvent(
					(Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame"),
					() => this.updatePosition(),
				);
			}
		}
	}

	public updatePosition() {
		// If ESC menu is open - freeze movement
		if (GameControls.isPaused()) {
			return;
		}

		// Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// Fix buttons positions
		if (GuiUtils.isCursorOnVisibleGui()) {
			return;
		}

		const target = this.mouse.Target;

		if (this.blockHighlight !== undefined) {
			this.blockHighlight.Destroy();

			this.updateMobileButtons();
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
		this.updateMobileButtons();
	}

	public updateMobileButtons() {
		// Show building mobile controls
		if (GameControls.getPlatform() === "Mobile" && this.blockHighlight !== undefined && this.isEquipped()) {
			this.gameUI.DeleteToolMobile.Visible = true;
			GuiAnimations.fade(this.gameUI.DeleteToolMobile, 0.1, "right");
		} else {
			this.gameUI.DeleteToolMobile.Visible = false;
		}
	}

	public removeHighlight() {
		if (this.blockHighlight !== undefined) {
			this.blockHighlight.Destroy();
		}
	}

	public unequip() {
		super.unequip();

		this.removeHighlight();
		this.updateMobileButtons();
	}
}
