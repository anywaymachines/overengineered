import { HttpService, Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import ActionController from "client/controller/ActionController";
import BuildingController from "client/controller/BuildingController";
import InputController from "client/controller/InputController";
import SoundController from "client/controller/SoundController";
import BuildingMode from "client/controller/modes/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import Serializer from "shared/Serializer";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";
import JSON from "shared/fixes/Json";
import BoxSelector from "./selectors/BoxSelector";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";

export default class DeleteTool extends ToolBase {
	public readonly onClearAllRequested = new Signal<() => void>();
	public readonly highlightedBlock = new ObservableValue<BlockModel | undefined>(undefined);

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverSelector = this.add(new HoveredBlockHighlighter());
		hoverSelector.highlightedBlock.autoSet(this.highlightedBlock);

		const fireSelected = async () => {
			if (InputController.inputType.get() !== "Desktop") return;

			const block = hoverSelector.highlightedBlock.get();
			if (!block) return;
			await this.deleteBlocks([block]);
		};
		this.onPrepare((input) => {
			if (input === "Desktop") {
				this.eventHandler.subscribe(this.mouse.Button1Down, () => {
					if (!InputController.isCtrlPressed()) {
						fireSelected();
					}
				});
			} else if (input === "Gamepad") {
				this.inputHandler.onKeyDown("ButtonX", fireSelected);
			} else if (input === "Touch") {
				this.inputHandler.onTouchTap(fireSelected);
			}
		});

		const boxSelector = this.add(new BoxSelector());
		this.event.subscribe(boxSelector.submitted, async (blocks) => await this.deleteBlocks(blocks));
	}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown("ButtonY", () => this.onClearAllRequested.Fire());
	}

	private blockToUndoRequest(block: BlockModel) {
		const info: PlaceBlockRequest = {
			location: block.PrimaryPart!.CFrame,
			id: block.GetAttribute("id") as string,
			color: Serializer.Color3Serializer.deserialize(
				HttpService.JSONDecode(block.GetAttribute("color") as string) as SerializedColor,
			),
			material: Serializer.EnumMaterialSerializer.deserialize(
				block.GetAttribute("material") as number as SerializedEnum,
			),
			config: JSON.deserialize<object>((block.GetAttribute("config") as string | undefined) ?? "{}"),
			plot: SharedPlots.getPlotByPosition(block.PrimaryPart!.Position)!,
		};

		return info;
	}

	public async deleteBlocks(blocks: readonly BlockModel[] | "all") {
		const getDeletedBlocks = () => {
			if (blocks === "all") {
				return SharedPlots.getPlotBlocks(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId)).GetChildren(
					undefined,
				);
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
			blocks === "all" ? ("all" as const) : deletedBlocks.map((block) => block.GetAttribute("uuid") as BlockUuid),
			(info) =>
				BuildingController.deleteBlock(
					info === "all" ? "all" : info.map((uuid) => BuildingManager.getBlockByUuidOnAnyPlot(uuid)!),
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
