import GameControls from "client/GameControls";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";
import ClientSignals from "client/ClientSignals";
import PlayerUtils from "shared/utils/PlayerUtils";
import GuiUtils from "client/utils/GuiUtils";
import { Players, Workspace } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import Remotes from "shared/NetworkDefinitions";
import SoundUtils from "shared/utils/SoundUtils";
import Logger from "shared/Logger";
import GuiAnimations from "client/gui/GuiAnimations";
import ConfirmationWindow from "client/gui/ConfirmationWindow";

export default class DeleteToolAPI extends AbstractToolAPI {
	public highlight?: Highlight;

	public displayGUI(): void {
		const platform = GameControls.getActualPlatform();
		if (platform !== "Console") {
			this.gameUI.ToolsGui.DeleteAllButton.Visible = true;
			GuiAnimations.fade(this.gameUI.ToolsGui.DeleteAllButton, 0.1, "down");
		}
		if (platform === "Touch" && this.highlight !== undefined) {
			this.gameUI.TouchControls.DeleteTool.Visible = true;
			GuiAnimations.fade(this.gameUI.TouchControls.DeleteTool, 0.1, "left");
		}
	}

	public updateGUI() {}

	public hideGUI(): void {
		this.gameUI.ToolsGui.DeleteAllButton.Visible = false;
		this.gameUI.TouchControls.DeleteTool.Visible = false;
	}

	public onPlatformChanged(platform: string): void {
		super.onPlatformChanged(platform);

		if (platform !== "Console") {
			this.eventHandler.registerEvent(this.gameUI.ToolsGui.DeleteAllButton.MouseButton1Click, () => {
				ConfirmationWindow.showConfirmationWindow("Confirmation", "Are you sure to clear all blocks?", () =>
					this.clearAll(),
				);
			});
		}

		// Initialize events
		switch (platform) {
			case "Touch":
				// Prepare touch events
				this.eventHandler.registerEvent(
					this.gameUI.TouchControls.DeleteTool.DeleteButton.MouseButton1Click,
					() => this.use(),
				);
				break;

			case "Console":
				// Prepare console events
				this.eventHandler.registerEvent(ClientSignals.CAMERA_MOVED, () => this.updatePosition());
				break;

			case "Desktop":
				// Prepare desktop events
				this.eventHandler.registerEvent(this.mouse.Button1Down, () => this.use());
				this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
				break;

			default:
				// Unsupported
				break;
		}
	}

	public updatePosition() {
		// ERROR: If ESC menu is open - freeze movement
		if (GameControls.isPaused()) {
			return;
		}

		// ERROR: Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// ERROR: Fix buttons positions
		if (GuiUtils.isCursorOnVisibleGui()) {
			return;
		}

		const target = this.mouse.Target;

		this.highlight?.Destroy();
		this.highlight = undefined;
		this.updateGUI();

		// ERROR: Mouse is in space
		if (target === undefined) {
			return;
		}

		// ERROR: Useless parts
		if (target.Parent === undefined || !target.IsDescendantOf(Workspace.Plots)) {
			return;
		}

		const parentPlot = SharedPlots.getPlotByBlock(target.Parent as Model);

		// ERROR: No plot?
		if (parentPlot === undefined) {
			return;
		}

		// ERROR: Plot is forbidden
		if (!BuildingManager.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
			return;
		}

		// Create highlight
		this.highlight = new Instance("Highlight");
		this.highlight.Parent = target.Parent;
		this.highlight.Adornee = target.Parent;

		this.updateGUI();
	}

	public async clearAll() {
		// Send block removing packet
		const response = await Remotes.Client.GetNamespace("Building").Get("PlayerClearAll").CallServerAsync();

		// Parsing response
		if (response.success) {
			// Block removed
			task.wait();

			this.gameUI.Sounds.Building.BlockDelete.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockDelete.Play();

			this.highlight = undefined;

			this.updateGUI();
		} else {
			// Block not removed
			Logger.info("[DELETING] Clearing all blocks failed: " + response.message);
		}
	}

	public async use() {
		// ERROR: No block selected
		if (this.highlight === undefined) {
			return;
		}

		// Send block removing packet
		const response = await Remotes.Client.GetNamespace("Building")
			.Get("PlayerDeleteBlock")
			.CallServerAsync({
				block: this.highlight.Parent as Model,
			});

		// Parsing response
		if (response.success) {
			// Block removed
			task.wait();

			this.gameUI.Sounds.Building.BlockDelete.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockDelete.Play();

			this.highlight = undefined;

			this.updateGUI();
		} else {
			// Block not removed
			Logger.info("[DELETING] Block deleting failed: " + response.message);
		}
	}

	public onUserInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			if (input.KeyCode === Enum.KeyCode.ButtonX) {
				// ButtonX to Remove
				this.use();
			} else if (input.KeyCode === Enum.KeyCode.ButtonY) {
				// ButtonX to clear all
				ConfirmationWindow.showConfirmationWindow("Confirmation", "Are you sure to clear all blocks?", () =>
					this.clearAll(),
				);
			}
		} else if (input.UserInputType === Enum.UserInputType.Touch) {
			// Touch to update position
			this.updatePosition();
		}
	}

	public equip(): void {
		super.equip();

		this.updatePosition();
	}

	public unequip(): void {
		super.unequip();

		this.highlight?.Destroy();
	}
}
