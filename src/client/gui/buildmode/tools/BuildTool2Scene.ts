import { InputController } from "client/controller/InputController";
import { Control } from "client/gui/Control";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { BlockSelectionControl, BlockSelectionControlDefinition } from "client/gui/buildmode/BlockSelection";
import {
	MaterialColorEditControl,
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import { MirrorEditorControl, MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import { ButtonControl } from "client/gui/controls/Button";
import { BuildTool2 } from "client/tools/BuildTool2";
import { BlocksInitializer } from "shared/BlocksInitializer";

export type BuildTool2SceneDefinition = GuiObject & {
	readonly ActionBar: GuiObject & {
		readonly Buttons: GuiObject & {
			readonly Mirror: GuiButton;
		};
	};
	readonly Mirror: GuiObject & {
		readonly Content: MirrorEditorControlDefinition;
	};
	readonly Bottom: MaterialColorEditControlDefinition;
	readonly Info: Frame & {
		readonly ViewportFrame: ViewportFrame;
		readonly DescriptionLabel: TextLabel;
		readonly NameLabel: TextLabel;
	};
	readonly Inventory: BlockSelectionControlDefinition;
	readonly Touch: Frame & {
		readonly PlaceButton: GuiButton;
		readonly RotateRButton: GuiButton;
		readonly RotateTButton: GuiButton;
		readonly RotateYButton: GuiButton;
	};
};

export class BuildTool2Scene extends Control<BuildTool2SceneDefinition> {
	readonly tool;
	readonly blockSelector;
	private readonly blockInfoPreviewControl: BlockPreviewControl;

	constructor(gui: BuildTool2SceneDefinition, tool: BuildTool2) {
		super(gui);
		this.tool = tool;

		this.blockSelector = new BlockSelectionControl(gui.Inventory);
		this.blockSelector.show();
		this.add(this.blockSelector);

		const mirrorEditor = this.add(new MirrorEditorControl(this.gui.Mirror.Content));
		mirrorEditor.value.set(tool.mirrorMode.get());
		this.event.subscribeObservable(mirrorEditor.value, (val) => tool.mirrorMode.set(val), true);
		this.onEnable(() => (this.gui.Mirror.Visible = false));
		this.add(
			new ButtonControl(
				this.gui.ActionBar.Buttons.Mirror,
				() => (this.gui.Mirror.Visible = !this.gui.Mirror.Visible),
			),
		);

		this.blockInfoPreviewControl = this.add(new BlockPreviewControl(this.gui.Info.ViewportFrame));
		this.event.subscribeObservable(
			this.blockSelector.selectedBlock,
			(block) => {
				this.gui.Info.Visible = block !== undefined;
				this.blockInfoPreviewControl.set(block?.model);
				this.tool.selectedBlock.set(block);

				if (block) {
					this.gui.Info.NameLabel.Text = block.displayName;
					this.gui.Info.DescriptionLabel.Text = block.info;

					GuiAnimator.transition(this.gui.Info, 0.2, "right");
				} else {
					this.gui.Info.NameLabel.Text = "";
					this.gui.Info.DescriptionLabel.Text = "";
				}
			},
			true,
		);

		this.add(new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor));

		const updateTouchControls = () => {
			const visible =
				InputController.inputType.get() === "Touch" && this.blockSelector.selectedBlock.get() !== undefined;
			this.gui.Touch.Visible = visible;

			if (visible) {
				GuiAnimator.transition(this.gui.Touch, 0.2, "left");
			}
		};
		const updateSelectedBlock = () => {
			const block = tool.selectedBlock.get();
			if (!block) {
				this.blockSelector.selectedBlock.set(undefined);
				return;
			}

			const targetCategory = BlocksInitializer.categories.getCategoryPath(block.category) ?? [];

			if (
				this.blockSelector.selectedCategory.get()[this.blockSelector.selectedCategory.get().size() - 1] !==
				targetCategory[targetCategory.size() - 1]
			) {
				this.blockSelector.selectedCategory.set(targetCategory);
			}

			this.blockSelector.selectedBlock.set(block);
		};

		this.event.onPrepare(updateTouchControls);
		this.event.subscribeObservable(tool.selectedBlock, updateTouchControls);
		this.event.subscribeObservable(tool.selectedBlock, updateSelectedBlock);
		updateTouchControls();
	}

	protected prepareTouch(): void {
		// Touchscreen controls
		this.eventHandler.subscribe(this.gui.Touch.PlaceButton.MouseButton1Click, () => this.tool.placeBlock());
		this.eventHandler.subscribe(this.gui.Touch.RotateRButton.MouseButton1Click, () =>
			this.tool.rotateBlock("x", true),
		);
		this.eventHandler.subscribe(this.gui.Touch.RotateTButton.MouseButton1Click, () =>
			this.tool.rotateBlock("y", true),
		);
		this.eventHandler.subscribe(this.gui.Touch.RotateYButton.MouseButton1Click, () =>
			this.tool.rotateBlock("z", true),
		);
	}

	show() {
		super.show();

		GuiAnimator.transition(this.gui.Inventory, 0.2, "right");
	}
}
