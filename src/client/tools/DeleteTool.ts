import { InputController } from "client/controller/InputController";
import { SoundController } from "client/controller/SoundController";
import { MirrorEditorControl } from "client/gui/buildmode/MirrorEditorControl";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { Signal } from "shared/event/Signal";
import type { MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";

namespace Scene {
	export type DeleteToolSceneDefinition = GuiObject & {
		readonly TouchControls: Frame & {
			readonly DeleteButton: TextButton;
		};
		readonly Bottom: Frame & {
			readonly DeleteAllButton: GuiButton;
		};
		readonly ActionBar: GuiObject & {
			readonly Buttons: GuiObject & {
				readonly Mirror: GuiButton;
			};
		};
		readonly Mirror: GuiObject & {
			readonly Content: MirrorEditorControlDefinition;
		};
	};

	export class DeleteToolScene extends Control<DeleteToolSceneDefinition> {
		private tool: DeleteTool;

		constructor(gui: DeleteToolSceneDefinition, tool: DeleteTool) {
			super(gui);
			this.tool = tool;

			const mirrorEditor = this.add(new MirrorEditorControl(this.gui.Mirror.Content, tool.targetPlot.get()));
			this.event.subscribeObservable(tool.mirrorMode, (val) => mirrorEditor.value.set(val), true);
			this.event.subscribe(mirrorEditor.submitted, (val) => tool.mirrorMode.set(val));
			this.onEnable(() => (this.gui.Mirror.Visible = false));
			this.add(
				new ButtonControl(
					this.gui.ActionBar.Buttons.Mirror,
					() => (this.gui.Mirror.Visible = !this.gui.Mirror.Visible),
				),
			);
			this.onPrepare((inputType) => {
				this.gui.TouchControls.Visible = false;
				this.gui.Bottom.DeleteAllButton.Visible = inputType !== "Gamepad";
			});

			const suggestClearAll = () => {
				ConfirmPopup.showPopup(
					"Are you sure you want to delete all blocks?",
					"It will be impossible to undo this action",
					() => this.tool.deleteBlocks("all"),
					() => {},
				);
			};

			this.event.subscribe(this.tool.onClearAllRequested, suggestClearAll);
			this.add(new ButtonControl(this.gui.Bottom.DeleteAllButton, suggestClearAll));
			this.add(new ButtonControl(this.gui.TouchControls.DeleteButton, () => this.tool.deleteHighlightedBlocks()));

			this.event.subscribeCollection(this.tool.highlightedBlocks, () => {
				if (this.tool.highlightedBlocks.size() !== 0) {
					this.gui.TouchControls.Visible = true;
					GuiAnimator.transition(this.gui.TouchControls, 0.1, "left");
				} else {
					this.gui.TouchControls.Visible = false;
				}
			});
		}

		show() {
			super.show();
			GuiAnimator.transition(this.gui.Bottom.DeleteAllButton, 0.2, "up");
		}
	}
}

export class DeleteTool extends ToolBase {
	readonly onClearAllRequested = new Signal<() => void>();
	readonly highlightedBlocks = new ObservableCollectionSet<BlockModel>();

	constructor(mode: BuildingMode) {
		super(mode);

		this.parentGui(
			new Scene.DeleteToolScene(ToolBase.getToolGui<"Delete", Scene.DeleteToolSceneDefinition>().Delete, this),
		);

		this.parent(new SelectedBlocksHighlighter(this.highlightedBlocks));

		const fireSelected = async (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;

			if (InputController.inputType.get() === "Touch") {
				this.highlightedBlocks.setRange(blocks);
				return;
			}

			await this.deleteBlocks(blocks);
		};
		const stuff = this.parent(new MultiBlockSelector(mode.targetPlot));
		stuff.submit.Connect(fireSelected);
	}

	supportsMirror() {
		return false;
	}

	protected prepareGamepad(): void {
		this.inputHandler.onKeyDown("ButtonY", () => this.onClearAllRequested.Fire());
	}

	deleteHighlightedBlocks() {
		const blocks = this.highlightedBlocks.getArr();
		this.highlightedBlocks.clear();

		return this.deleteBlocks(blocks);
	}
	async deleteBlocks(blocks: readonly BlockModel[] | "all") {
		if (blocks !== "all" && blocks.size() === 0) {
			return;
		}
		if (blocks !== "all" && blocks.any((b) => !this.targetPlot.get().hasBlock(b))) {
			return;
		}

		const response = await ClientBuilding.deleteOperation.execute({ plot: this.targetPlot.get(), blocks });
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
