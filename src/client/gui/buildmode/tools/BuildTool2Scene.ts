import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import BlockPreviewControl from "client/gui/buildmode/BlockPreviewControl";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "client/gui/buildmode/BlockSelection";
import MaterialColorEditControl, {
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import MirrorEditorControl, { MirrorEditorControlDefinition } from "client/gui/buildmode/MirrorEditorControl";
import { ButtonControl } from "client/gui/controls/Button";
import BuildTool2 from "client/tools/BuildTool2";

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

export default class BuildTool2Scene extends Control<BuildTool2SceneDefinition> {
	readonly tool;
	readonly blockSelector;

	private blockInfoPreviewControl?: BlockPreviewControl;

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

		this.event.subscribeObservable(this.blockSelector.selectedBlock, (block) => {
			this.tool.selectedBlock.set(block);

			// Clear block info
			if (this.blockInfoPreviewControl) {
				this.blockInfoPreviewControl.clear();
				this.remove(this.blockInfoPreviewControl);
				this.blockInfoPreviewControl = undefined;
			}

			this.gui.Info.NameLabel.Text = "";
			this.gui.Info.DescriptionLabel.Text = "";

			// Set block info
			if (block) {
				this.blockInfoPreviewControl = this.add(
					new BlockPreviewControl(this.gui.Info.ViewportFrame, block.model),
				);
				this.gui.Info.NameLabel.Text = block.displayName;
				this.gui.Info.DescriptionLabel.Text = block.info;

				GuiAnimator.transition(this.gui.Info, 0.2, "right");
			}
		});

		this.add(new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor));

		const updateTouchControls = () => {
			const visible =
				InputController.inputType.get() === "Touch" && this.blockSelector.selectedBlock.get() !== undefined;
			this.gui.Touch.Visible = visible;

			if (visible) {
				GuiAnimator.transition(this.gui.Touch, 0.2, "left");
			}
		};
		this.event.onPrepare(updateTouchControls);
		this.event.subscribeObservable(tool.selectedBlock, updateTouchControls);
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
