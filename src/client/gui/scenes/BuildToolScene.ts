import Scene from "client/base/Scene";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../tools/BlockSelection";
import BlockRegistry from "shared/registry/BlocksRegistry";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import BuildTool from "client/tools/BuildTool";
import GuiAnimator from "../GuiAnimator";
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

export default class BuildToolScene extends Scene<BuildToolSceneDefinition> {
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
		this.blockSelector.setVisible(true);
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

		this.event.subscribeObservable(MaterialChooserControl.instance.selectedMaterial, (material) => {
			this.tool.setSelectedMaterial(material);
		});
		this.event.subscribeObservable(MaterialChooserControl.instance.selectedColor, (color) => {
			this.tool.setSelectedColor(color);
		});

		this.event.subscribe(this.gui.Preview.EditMaterialButton.Activated, () => {
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

	public show(): void {
		super.show();

		GuiAnimator.transition(this.gui.BlockSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.Preview, 0.2, "right");
	}
}
