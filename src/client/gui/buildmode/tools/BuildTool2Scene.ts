import Control from "client/base/Control";
import InputController from "client/controller/InputController";
import BuildTool2 from "client/tools/BuildTool2";
import GuiAnimator from "../../GuiAnimator";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../BlockSelection";
import MaterialChooserControl from "../MaterialChooser";
import { MaterialPreviewDefinition } from "../MaterialPreviewControl";
import MirrorEditorControl, { MirrorEditorControlDefinition } from "../MirrorEditorControl";

export type BuildTool2SceneDefinition = GuiObject & {
	readonly BlockInfo: Frame & {
		ViewportFrame: MaterialPreviewDefinition;
		DescriptionLabel: TextLabel;
		NameLabel: TextLabel;
	};
	readonly Inventory: BlockSelectionControlDefinition;
	//readonly Mirrors: MirrorEditorControlDefinition;
	readonly TouchControls: Frame & {
		readonly PlaceButton: TextButton;
		readonly RotateRButton: TextButton;
		readonly RotateTButton: TextButton;
		readonly RotateYButton: TextButton;
	};
	readonly Mirrors: MirrorEditorControlDefinition;
};

export default class BuildTool2Scene extends Control<BuildTool2SceneDefinition> {
	readonly tool;
	readonly blockSelector;
	readonly mirrors;

	constructor(gui: BuildTool2SceneDefinition, tool: BuildTool2) {
		super(gui);
		this.tool = tool;

		this.blockSelector = new BlockSelectionControl(gui.Inventory);
		this.blockSelector.show();
		this.add(this.blockSelector);

		this.mirrors = this.added(new MirrorEditorControl(this.gui.Mirrors));
		this.mirrors.show();
		this.tool.mirrorMode.bindTo(this.mirrors.value);

		this.tool.selectedBlock.bindTo(this.blockSelector.selectedBlock);

		this.onPrepare((inputType) => (this.gui.TouchControls.Visible = inputType === "Touch"));

		MaterialChooserControl.instance.selectedMaterial.bindTo(tool.selectedMaterial);
		MaterialChooserControl.instance.selectedColor.bindTo(tool.selectedColor);

		this.event.subscribeObservable(
			tool.selectedBlock,
			(block) => {
				if (InputController.inputType.get() !== "Touch") return;

				const visible = block !== undefined;
				this.gui.TouchControls.Visible = visible;

				if (visible) {
					GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");
				}
			},
			false,
		);
	}

	protected prepareTouch(): void {
		// Touchscreen controls
		this.eventHandler.subscribe(this.gui.TouchControls.PlaceButton.MouseButton1Click, () => this.tool.placeBlock());
		this.eventHandler.subscribe(this.gui.TouchControls.RotateRButton.MouseButton1Click, () =>
			this.tool.rotateBlock("x", true),
		);
		this.eventHandler.subscribe(this.gui.TouchControls.RotateTButton.MouseButton1Click, () =>
			this.tool.rotateBlock("y", true),
		);
		this.eventHandler.subscribe(this.gui.TouchControls.RotateYButton.MouseButton1Click, () =>
			this.tool.rotateBlock("z", true),
		);
	}
}
