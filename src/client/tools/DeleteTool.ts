import { GuiService, Players, UserInputService, Workspace } from "@rbxts/services";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import Signals from "client/event/Signals";
import DeleteToolWidget from "client/gui/widget/tools/DeleteToolWidget";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class DeleteTool extends ToolBase {
	public highlight: ObjectValue = new Instance("ObjectValue");

	// GUI
	private readonly widget: DeleteToolWidget = new DeleteToolWidget(this);

	protected prepare(): void {
		super.prepare();

		this.eventHandler.subscribe(Signals.BLOCKS.ADDED, () => this.updatePosition());
		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, () => this.updatePosition());
	}

	protected prepareDesktop(): void {
		this.eventHandler.subscribe(this.mouse.Button1Down, () => this.deleteBlock());
		this.eventHandler.subscribe(this.mouse.Move, () => this.updatePosition());
	}

	protected prepareTouch(): void {
		// Touch controls
		this.inputHandler.onTouchTap(() => this.updatePosition());
	}

	protected prepareGamepad(): void {
		// Gamepad buttons controls
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonX, () => this.deleteBlock());
		this.inputHandler.onKeyPressed(Enum.KeyCode.ButtonY, () => this.widget.suggestClearAll());

		// Prepare console events
		this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
	}

	public async clearAll() {
		const removedBlocks = SharedPlots.getPlotBlocks(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId))
			.GetChildren()
			.map((block) => this.blockToUndoRequest(block as Model));

		const response = await ActionController.instance.executeOperation(
			"Plot clear",
			async () => {
				for (const block of removedBlocks) await BuildingController.placeBlock(block);
			},
			undefined,
			() => BuildingController.clearPlot(),
		);

		// Parsing response
		if (response) {
			// Block removed
			task.wait();

			SoundController.getSounds().Building.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Building.BlockDelete.Play();
		}
	}

	private blockToUndoRequest(block: Model) {
		const info: PlayerPlaceBlockRequest = {
			location: block.PrimaryPart!.CFrame,
			block: block.GetAttribute("blockid") as string,
			material: Enum.Material.GetEnumItems().find((e) => e.Name === (block.GetAttribute("material") as string))!,
		};

		return info;
	}

	public async deleteBlock() {
		// ERROR: No block selected
		if (this.highlight.Value === undefined) {
			return;
		}

		const undoRequest = this.blockToUndoRequest(this.highlight.Value.Parent as Model);
		const response = await ActionController.instance.executeOperation(
			"Block removed",
			async () => {
				await BuildingController.placeBlock(undoRequest);
			},
			(this.highlight.Value.Parent as Model).GetPivot().Position,
			(info) => BuildingController.deleteBlock(BuildingManager.getBlockByPosition(info)!),
		);

		// Parsing response
		if (response.success) {
			// Block removed
			task.wait();

			SoundController.getSounds().Building.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Building.BlockDelete.Play();

			this.destroyHighlight();
			this.updatePosition();
		}
	}

	public updatePosition() {
		// ERROR: If ESC menu is open - freeze movement
		if (GuiService.MenuIsOpen) {
			return;
		}

		// ERROR: Non-alive players bypass
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// ERROR: Fix buttons positions
		if (GuiController.isCursorOnVisibleGui()) {
			return;
		}

		const target = this.mouse.Target;

		this.destroyHighlight();

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
		this.createHighlight(target);
	}

	public createHighlight(target: BasePart) {
		const instance = new Instance("Highlight");
		instance.Parent = target.Parent;
		instance.Adornee = target.Parent;
		this.highlight.Value = instance;
	}

	public destroyHighlight() {
		this.highlight.Value?.Destroy();
		this.highlight.Value = undefined;
	}

	getDisplayName(): string {
		return "Deleting Mode";
	}

	getImageID(): string {
		return "rbxassetid://12539349041";
	}

	getShortDescription(): string {
		return "Remove unnecessary blocks";
	}

	public getGamepadTooltips(): { image: string; text: string }[] {
		const keys: { image: string; text: string }[] = [];

		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonY), text: "Clear all" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonX), text: "Delete" });
		keys.push({ image: UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonB), text: "Unequip" });

		return keys;
	}

	public getKeyboardTooltips(): { key: string; text: string }[] {
		return [];
	}

	activate(): void {
		super.activate();

		this.widget.showWidget(true);
		this.updatePosition();
	}

	deactivate(): void {
		super.deactivate();

		this.widget.hideWidget(true);
		this.destroyHighlight();
	}
}
