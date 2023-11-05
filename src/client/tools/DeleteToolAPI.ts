import InputController from "client/core/InputController";
import AbstractToolAPI from "../gui/abstract/AbstractToolAPI";
import Signals from "client/core/network/Signals";
import PlayerUtils from "shared/utils/PlayerUtils";
import GuiUtils from "client/utils/GuiUtils";
import { Players, Workspace } from "@rbxts/services";
import SharedPlots from "shared/building/SharedPlots";
import BuildingManager from "shared/building/BuildingManager";
import Remotes from "shared/NetworkDefinitions";
import SoundUtils from "shared/utils/SoundUtils";
import Logger from "shared/Logger";
import GuiAnimations from "client/utils/GuiAnimations";
import ConfirmPopupGUI from "client/gui/ConfirmPopupGUI";

export default class DeleteToolAPI extends AbstractToolAPI {
	public highlight: ObjectValue = new Instance("ObjectValue");

	public displayGUI(noAnimations?: boolean): void {
		const platform = InputController.currentPlatform;
		if (platform !== "Console") {
			this.gameUI.ToolsGui.DeleteAllButton.Visible = true;
			if (!noAnimations) {
				GuiAnimations.fade(this.gameUI.ToolsGui.DeleteAllButton, 0.1, "down");
			}
		}
		this.eventHandler.registerEvent(this.highlight.Changed, () => {
			if (platform === "Touch" && this.highlight.Value !== undefined) {
				this.gameUI.TouchControls.DeleteTool.Visible = true;
				GuiAnimations.fade(this.gameUI.TouchControls.DeleteTool, 0.1, "left");
			} else {
				this.gameUI.TouchControls.DeleteTool.Visible = false;
			}
		});
	}

	public hideGUI(): void {
		this.gameUI.ToolsGui.DeleteAllButton.Visible = false;
		this.gameUI.TouchControls.DeleteTool.Visible = false;
	}

	public prepareEvents(platform: typeof InputController.currentPlatform): void {
		super.prepareEvents(platform);

		if (platform !== "Console") {
			this.eventHandler.registerEvent(this.gameUI.ToolsGui.DeleteAllButton.MouseButton1Click, () => {
				ConfirmPopupGUI.showConfirmationWindow("Confirmation", "Are you sure to clear all blocks?", () =>
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
					() => this.deleteBlock(),
				);
				break;

			case "Console":
				// Prepare console events
				this.eventHandler.registerEvent(Signals.CAMERA_MOVED, () => this.updatePosition());
				break;

			case "Desktop":
				// Prepare desktop events
				this.eventHandler.registerEvent(this.mouse.Button1Down, () => this.deleteBlock());
				this.eventHandler.registerEvent(this.mouse.Move, () => this.updatePosition());
				break;

			default:
				// Unsupported
				break;
		}
	}

	public updatePosition() {
		// ERROR: If ESC menu is open - freeze movement
		if (InputController.isPaused()) {
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

		this.highlight.Value?.Destroy();
		this.highlight.Value = undefined;

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
		const instance = new Instance("Highlight");
		instance.Parent = target.Parent;
		instance.Adornee = target.Parent;
		this.highlight.Value = instance;
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

			this.highlight.Value?.Destroy();
			this.highlight.Value = undefined;
		} else {
			// Block not removed
			Logger.info("[DELETING] Clearing all blocks failed: " + response.message);
		}
	}

	public async deleteBlock() {
		// ERROR: No block selected
		if (this.highlight.Value === undefined) {
			return;
		}

		// Send block removing packet
		const response = await Remotes.Client.GetNamespace("Building")
			.Get("PlayerDeleteBlock")
			.CallServerAsync({
				block: this.highlight.Value.Parent as Model,
			});

		// Parsing response
		if (response.success) {
			// Block removed
			task.wait();

			this.gameUI.Sounds.Building.BlockDelete.PlaybackSpeed = SoundUtils.randomSoundSpeed();
			this.gameUI.Sounds.Building.BlockDelete.Play();

			this.highlight.Value?.Destroy();
			this.highlight.Value = undefined;
		} else {
			// Block not removed
			Logger.info("[DELETING] Block deleting failed: " + response.message);
		}
	}

	public onUserInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Gamepad1) {
			if (input.KeyCode === Enum.KeyCode.ButtonX) {
				// ButtonX to Remove
				this.deleteBlock();
			} else if (input.KeyCode === Enum.KeyCode.ButtonY) {
				// ButtonX to clear all
				ConfirmPopupGUI.showConfirmationWindow("Confirmation", "Are you sure to clear all blocks?", () =>
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

		this.highlight.Value?.Destroy();
	}
}
