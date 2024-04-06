import { InputController } from "client/controller/InputController";
import { SoundController } from "client/controller/SoundController";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { BoxSelector } from "client/tools/selectors/BoxSelector";
import { HoveredBlockHighlighter } from "client/tools/selectors/HoveredBlockHighlighter";
import { SelectorParent } from "client/tools/selectors/SelectorParent";
import { TutorialDeleteBlockHighlight } from "client/tutorial/TutorialDeleteTool";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";

export class DeleteTool extends ToolBase {
	readonly onClearAllRequested = new Signal<() => void>();
	readonly highlightedBlock = new ObservableValue<BlockModel | undefined>(undefined);
	tutorialBlocksToRemove: (TutorialDeleteBlockHighlight & { instance: Instance })[] = [];

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverHighlighter = this.parent(new HoveredBlockHighlighter((b) => this.targetPlot.get().hasBlock(b)));
		hoverHighlighter.highlightedBlock.autoSet(this.highlightedBlock);

		const fireSelected = async () => {
			if (InputController.inputType.get() === "Touch") return;

			const block = hoverHighlighter.highlightedBlock.get();
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

		const selectorParent = this.parent(new SelectorParent());
		selectorParent.childSet.Connect((child) => {
			if (!this.isEnabled()) return;
			hoverHighlighter.setEnabled(!child);
		});
		this.event.subInput((ih) => {
			ih.onMouse1Down(() => {
				if (InputController.isCtrlPressed()) {
					selectorParent.tryEnableSelector(() => {
						return new BoxSelector(async (blocks) => await this.deleteBlocks(blocks));
					});
				}
			}, false);
		});
	}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown("ButtonY", () => this.onClearAllRequested.Fire());
	}

	async deleteBlocks(blocks: readonly BlockModel[] | "all") {
		if (blocks !== "all" && blocks.any((b) => !this.targetPlot.get().hasBlock(b))) {
			return;
		}

		if (blocks !== "all" && this.tutorialBlocksToRemove && this.tutorialBlocksToRemove.size() > 0) {
			if (
				blocks.any(
					(value) =>
						!this.tutorialBlocksToRemove!.find(
							(value2) =>
								this.targetPlot
									.get()
									.instance.BuildingArea.CFrame.PointToObjectSpace(value.GetPivot().Position) ===
								value2.position,
						),
				)
			) {
				return;
			}
		}

		const response = await ClientBuilding.deleteBlocks(this.targetPlot.get(), blocks);
		if (response.success) {
			task.wait();

			SoundController.getSounds().Build.BlockDelete.PlaybackSpeed = SoundController.randomSoundSpeed();
			SoundController.getSounds().Build.BlockDelete.Play();
		}
	}
	getDisplayName(): string {
		return "Delete";
	}

	getImageID(): string {
		return "rbxassetid://12539349041";
	}

	protected getTooltips(): InputTooltips {
		return {
			Gamepad: [
				{ keys: ["ButtonY"], text: "Clear all" },
				{ keys: ["ButtonX"], text: "Delete" },
				{ keys: ["ButtonB"], text: "Unequip" },
			],
		};
	}

	getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		const keys: { key: Enum.KeyCode; text: string }[] = [];

		keys.push({ key: Enum.KeyCode.ButtonY, text: "Clear all" });
		keys.push({ key: Enum.KeyCode.ButtonX, text: "Delete" });
		keys.push({ key: Enum.KeyCode.ButtonB, text: "Unequip" });

		return keys;
	}

	getKeyboardTooltips() {
		return [];
	}
}
