import { HttpService, Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import SoundController from "client/controller/SoundController";
import Serializer from "shared/Serializer";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import BlockSelector from "./BlockSelector";
import Signals from "client/event/Signals";

export default class DeleteTool extends ToolBase {
	public readonly onClearAllRequested = new Signal<() => void>();
	public readonly selector;

	constructor() {
		super();

		this.selector = new BlockSelector(this.eventHandler, this.inputHandler);
		this.selector.blockSelected.Connect((block) => {
			if (!block) return;

			if (Signals.INPUT_TYPE.get() === "Desktop") {
				this.deleteBlock(block);
			}
		});
	}

	protected prepare(): void {
		super.prepare();
		this.selector.prepare();
	}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown(Enum.KeyCode.ButtonY, () => this.onClearAllRequested.Fire());
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

			SoundController.getSounds().BuildingMode.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().BuildingMode.BlockDelete.Play();
		} else {
			SoundController.getSounds().BuildingMode.BlockPlaceError.Play();
		}
	}

	private blockToUndoRequest(block: Model) {
		const info: PlaceBlockRequest = {
			location: block.PrimaryPart!.CFrame,
			block: block.GetAttribute("id") as string,
			color: Serializer.Color3Serializer.deserialize(
				HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor,
			),
			material: Serializer.EnumMaterialSerializer.deserialize(
				block.GetAttribute("material") as number as SerializedEnum,
			),
		};

		return info;
	}

	public async deleteSelectedBlock() {
		const selected = this.selector.getHighlightedBlock();
		if (selected) await this.deleteBlock(selected);
	}
	public async deleteBlock(block: Model) {
		const undoRequest = this.blockToUndoRequest(block);
		const response = await ActionController.instance.executeOperation(
			"Block removed",
			async () => {
				await BuildingController.placeBlock(undoRequest);
			},
			block.GetPivot().Position,
			(info) => BuildingController.deleteBlock(BuildingManager.getBlockByPosition(info)!),
		);

		// Parsing response
		if (response.success) {
			// Block removed
			task.wait();

			SoundController.getSounds().BuildingMode.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().BuildingMode.BlockDelete.Play();
		}
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

	public getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.ButtonY, text: "Clear all" });
		keys.push({ key: Enum.KeyCode.ButtonX, text: "Delete" });
		keys.push({ key: Enum.KeyCode.ButtonB, text: "Unequip" });

		return keys;
	}

	public getKeyboardTooltips() {
		return [];
	}

	deactivate() {
		super.deactivate();
		this.selector.deactivate();
	}
}
