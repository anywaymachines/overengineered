import Control from "client/base/Control";
import BuildTool from "client/tools/BuildTool";
import { blockList, categoriesRegistry } from "shared/Registry";
import GuiAnimator from "../GuiAnimator";
import { ButtonControl } from "../controls/Button";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../tools/BlockSelection";
import MaterialChooserControl, { MaterialPreviewControl, MaterialPreviewDefinition } from "../tools/MaterialChooser";

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

		this.blockSelector = new BlockSelectionControl(gui.BlockSelection, blockList, categoriesRegistry);
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

		const editMaterialButton = this.added(new ButtonControl(this.gui.Preview.EditMaterialButton));
		this.event.subscribe(editMaterialButton.activated, () => {
			MaterialChooserControl.instance.show();
		});

		this.event.subscribe(
			tool.selectedBlockChanged,
			(block) => {
				const visible = block !== undefined;
				this.gui.TouchControls.Visible = visible;

				if (visible) {
					GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");
				}
			},
			"Touch",
		);
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

		GuiAnimator.transition(this.gui.BlockSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.Preview, 0.2, "right");
	}
}
