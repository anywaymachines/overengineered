import Scene from "client/base/Scene";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "../tools/BlockSelection";
import BlockRegistry from "shared/registry/BlocksRegistry";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import BuildTool from "client/tools/BuildTool";
import GuiAnimator from "../GuiAnimator";

export type BuildToolSceneDefinition = GuiObject & {
	BlockSelection: BlockSelectionControlDefinition;
	Preview: GuiObject;
	TouchControls: GuiObject;
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

		this.event.subscribeObservable("All", this.blockSelector.selectedBlock, (block) =>
			this.tool.setSelectedBlock(block),
		);

		this.event.onInputTypeChange((inputType) => (this.gui.TouchControls.Visible = inputType === "Touch"), true);
	}

	protected prepareTouch(): void {
		this.gui.TouchControls.Visible = true;
		GuiAnimator.transition(this.gui.TouchControls, 0.2, "left");
	}

	public show(): void {
		super.show();

		GuiAnimator.transition(this.gui.BlockSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.Preview, 0.2, "right");
	}
}
