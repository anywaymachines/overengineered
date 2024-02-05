import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import BlockPreviewControl from "client/gui/buildmode/BlockPreviewControl";
import BlockSelectionControl, { BlockSelectionControlDefinition } from "client/gui/buildmode/BlockSelection";
import MaterialColorEditControl, {
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import BuildTool from "client/tools/BuildTool";
import Registry, { categoriesRegistry } from "shared/Registry";

export type BuildToolSceneDefinition = GuiObject & {
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

export default class BuildToolScene extends Control<BuildToolSceneDefinition> {
	readonly tool;
	readonly blockSelector;

	private readonly blockInfoPreviewControl: BlockPreviewControl;

	constructor(gui: BuildToolSceneDefinition, tool: BuildTool) {
		super(gui);
		this.tool = tool;

		this.blockSelector = new BlockSelectionControl(gui.Inventory);
		this.blockSelector.show();
		this.add(this.blockSelector);

		this.blockInfoPreviewControl = this.add(new BlockPreviewControl(this.gui.Info.ViewportFrame));
		this.gui.Info.Visible = false;

		this.event.subscribeObservable(this.blockSelector.selectedBlock, (block) => {
			this.gui.Info.Visible = block !== undefined;
			this.blockInfoPreviewControl.set(block);
			this.tool.setSelectedBlock(block);

			// Clear block info
			this.gui.Info.NameLabel.Text = "";
			this.gui.Info.DescriptionLabel.Text = "";

			// Set block info
			if (block) {
				this.gui.Info.NameLabel.Text = block.displayName;
				this.gui.Info.DescriptionLabel.Text = block.info;

				GuiAnimator.transition(this.gui.Info, 0.2, "right");
			}
		});

		this.event.subscribe(this.tool.pickSignal, (block) => {
			const targetCategory = Registry.findCategoryPath(categoriesRegistry, block.category)!;

			if (
				this.blockSelector.selectedCategory.get()[this.blockSelector.selectedCategory.get().size() - 1] !==
				targetCategory[targetCategory.size() - 1]
			) {
				this.blockSelector.selectedCategory.set(targetCategory);
			}

			this.blockSelector.selectedBlock.set(block);
		});

		const enable = () => {
			// to not place a block
			task.wait();

			this.tool.enable();
		};
		const disable = () => {
			this.tool.disable();
		};

		const materialColorEditor = this.add(
			new MaterialColorEditControl(this.gui.Bottom, tool.selectedMaterial, tool.selectedColor),
		);
		materialColorEditor.materialPipette.onStart.Connect(disable);
		materialColorEditor.materialPipette.onEnd.Connect(enable);
		materialColorEditor.colorPipette.onStart.Connect(disable);
		materialColorEditor.colorPipette.onEnd.Connect(enable);
		this.blockSelector.pipette.onStart.Connect(disable);
		this.blockSelector.pipette.onEnd.Connect(enable);

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
		this.eventHandler.subscribe(this.gui.Touch.RotateRButton.MouseButton1Click, () => this.tool.rotate("x", true));
		this.eventHandler.subscribe(this.gui.Touch.RotateTButton.MouseButton1Click, () => this.tool.rotate("y", true));
		this.eventHandler.subscribe(this.gui.Touch.RotateYButton.MouseButton1Click, () => this.tool.rotate("z", true));
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.Inventory, 0.2, "right");

		GuiAnimator.transition(this.gui.Bottom.MaterialButton, 0.2, "up");
		GuiAnimator.transition(this.gui.Bottom.ColorButton, 0.25, "up");
	}
}
