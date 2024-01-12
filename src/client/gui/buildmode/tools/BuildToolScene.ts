import Control from "client/base/Control";
import InputController from "client/controller/InputController";
import BuildTool from "client/tools/BuildTool";
import GuiAnimator from "../../GuiAnimator";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../BlockSelection";
import MaterialChooserControl from "../MaterialChooser";

export type BuildToolSceneDefinition = GuiObject & {
	readonly Inventory: BlockSelectionControlDefinition;
	//readonly Mirrors: MirrorEditorControlDefinition;
	readonly TouchControls: Frame & {
		readonly PlaceButton: TextButton;
		readonly RotateRButton: TextButton;
		readonly RotateTButton: TextButton;
		readonly RotateYButton: TextButton;
	};
};

export default class BuildToolScene extends Control<BuildToolSceneDefinition> {
	readonly tool;
	readonly blockSelector;

	constructor(gui: BuildToolSceneDefinition, tool: BuildTool) {
		super(gui);
		this.tool = tool;

		//this.gui.Mirrors.Visible = false;

		this.blockSelector = new BlockSelectionControl(gui.Inventory);
		this.blockSelector.show();
		this.add(this.blockSelector);

		this.event.subscribeObservable(this.blockSelector.selectedBlock, (block) => this.tool.setSelectedBlock(block));

		//this.add(new MaterialPreviewEditControl(this.gui.Preview, tool.selectedMaterial, tool.selectedColor));

		MaterialChooserControl.instance.selectedMaterial.bindTo(tool.selectedMaterial);
		MaterialChooserControl.instance.selectedColor.bindTo(tool.selectedColor);

		const updateTouchControls = () => {
			const visible =
				InputController.inputType.get() === "Touch" && this.blockSelector.selectedBlock.get() !== undefined;
			this.gui.TouchControls.Visible = visible;

			if (visible) {
				GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");
			}
		};
		this.event.onPrepare(updateTouchControls);
		this.event.subscribeObservable(tool.selectedBlock, updateTouchControls);
		updateTouchControls();
	}

	protected prepareTouch(): void {
		// Touchscreen controls
		this.eventHandler.subscribe(this.gui.TouchControls.PlaceButton.MouseButton1Click, () => this.tool.placeBlock());
		this.eventHandler.subscribe(this.gui.TouchControls.RotateRButton.MouseButton1Click, () =>
			this.tool.rotate("x", true),
		);
		this.eventHandler.subscribe(this.gui.TouchControls.RotateTButton.MouseButton1Click, () =>
			this.tool.rotate("y", true),
		);
		this.eventHandler.subscribe(this.gui.TouchControls.RotateYButton.MouseButton1Click, () =>
			this.tool.rotate("z", true),
		);
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.Inventory, 0.2, "right");
	}
}
