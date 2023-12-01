import Control from "client/base/Control";
import BlockRegistry from "shared/registry/BlocksRegistry";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import BuildTool from "client/tools/BuildTool";
import GuiAnimator from "../GuiAnimator";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../tools/BlockSelection";
import MaterialChooserControl, { MaterialPreviewControl, MaterialPreviewDefinition } from "../tools/MaterialChooser";
import SoundController from "client/controller/SoundController";

export type BuildToolSceneDefinition = GuiObject & {
	BlockSelection: BlockSelectionControlDefinition;
	Preview: MaterialPreviewDefinition & {
		EditMaterialButton: GuiButton;
	};
	TouchControls: Frame & {
		PlaceButton: TextButton;
		RotateRButton: TextButton;
		RotateTButton: TextButton;
		RotateYButton: TextButton;
	};
};

export default class BuildToolScene extends Control<BuildToolSceneDefinition> {
	readonly tool;
	readonly blockSelector;

	constructor(gui: BuildToolSceneDefinition, tool: BuildTool) {
		super(gui);
		this.tool = tool;

		this.blockSelector = new BlockSelectionControl(
			gui.BlockSelection,
			BlockRegistry.RegisteredBlocks,
			CategoriesRegistry.registeredCategories,
		);
		this.blockSelector.show();
		this.add(this.blockSelector);

		this.event.subscribeObservable(this.blockSelector.selectedBlock, (block) => this.tool.setSelectedBlock(block));

		this.event.onPrepare((inputType) => (this.gui.TouchControls.Visible = inputType === "Touch"), true);

		this.add(
			new MaterialPreviewControl(
				this.gui.Preview,
				MaterialChooserControl.instance.selectedMaterial,
				MaterialChooserControl.instance.selectedColor,
			),
		);

		this.event.subscribe(this.gui.Preview.EditMaterialButton.Activated, () => {
			SoundController.getSounds().Click.Play();
			MaterialChooserControl.instance.show();
		});
	}

	protected prepareTouch(): void {
		this.gui.TouchControls.Visible = true;
		GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");

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

		GuiAnimator.transition(this.gui.BlockSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.Preview, 0.2, "right");
	}
}
