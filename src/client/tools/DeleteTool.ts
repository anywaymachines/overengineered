import { HttpService, Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import ToolBase from "client/base/ToolBase";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import SoundController from "client/controller/SoundController";
import Serializer from "shared/Serializer";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import { initializeMultiBlockSelection, initializeSingleBlockSelection } from "./MultiBlockSelector";
import ObservableValue from "shared/event/ObservableValue";

export default class DeleteTool extends ToolBase {
	public readonly onClearAllRequested = new Signal<() => void>();
	public readonly highlightedBlock = new ObservableValue<Model | undefined>(undefined);

	protected prepare() {
		super.prepare();

		initializeSingleBlockSelection(
			this.eventHandler,
			this.inputHandler,
			(block) => this.highlightedBlock.set(block),
			async (block) => {
				if (!block) return;
				// if (Signals.INPUT_TYPE.get() !== "Desktop")  return;
				await this.deleteBlocks([block]);
			},
			() => true,
		);
		initializeMultiBlockSelection(this.eventHandler, async (blocks) => {
			await this.deleteBlocks(blocks);
		});
	}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown(Enum.KeyCode.ButtonY, () => this.onClearAllRequested.Fire());
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

	public async deleteBlocks(blocks: readonly Model[] | "all") {
		const getDeletedBlocks = () => {
			if (blocks === "all") {
				return SharedPlots.getPlotBlocks(
					SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId),
				).GetChildren() as Model[];
			}

			return blocks;
		};

		const deletedBlocks = getDeletedBlocks();

		const undoRequests = deletedBlocks.map((block) => this.blockToUndoRequest(block));
		const response = await ActionController.instance.executeOperation(
			blocks === "all" ? "Plot cleared" : "Blocks removed",
			async () => {
				for (const undo of undoRequests) {
					await BuildingController.placeBlock(undo);
				}
			},
			blocks === "all" ? ("all" as const) : deletedBlocks.map((block) => block.GetPivot().Position),
			(info) =>
				BuildingController.deleteBlock(
					info === "all" ? "all" : info.map((pos) => BuildingManager.getBlockByPosition(pos)!),
				),
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
}
