import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import SoundController from "client/controller/SoundController";
import GuiAnimator from "client/gui/GuiAnimator";
import PopupWidgets from "client/gui/PopupWidgets";
import BuildTool from "client/tools/BuildTool";
import BlockRegistry from "shared/registry/BlocksRegistry";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "shared/registry/abstract/AbstractCategory";

export default class BuildToolWidget extends Widget {
	private blockTemplate: TextButton & { Frame: Frame & { LimitLabel: TextLabel }; TextLabel: TextLabel };
	private gui: BuildToolGui;
	private tool: BuildTool;

	// Templates
	private categoryTemplate: TextButton & { Frame: Frame & { ImageLabel: ImageLabel }; TextLabel: TextLabel };
	// Menu selection
	private selectionButtons: TextButton[] = [];
	private selectedCategory?: AbstractCategory;
	public selectedMaterial: Enum.Material = Enum.Material.Plastic;
	public selectedBlock?: AbstractBlock;

	constructor(buildTool: BuildTool) {
		super();

		this.tool = buildTool;
		this.gui = this.getGui();

		// Prepare templates
		this.categoryTemplate = this.gui.Selection.Buttons.CategoryTemplate.Clone();
		this.blockTemplate = this.gui.Selection.Buttons.BlockTemplate.Clone();
		this.gui.Selection.Buttons.CategoryTemplate.Destroy();
		this.gui.Selection.Buttons.BlockTemplate.Destroy();
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.gui.Visible = false;
	}

	showWidget(hasAnimations: boolean): void {
		super.showWidget(hasAnimations);

		this.gui.Visible = true;
		GuiAnimator.transition(this.gui.Selection, 0.1, "right");

		this.updateLists(true);
	}

	private getGui() {
		if (!(this.gui && this.gui.Parent !== undefined)) {
			this.gui = GuiController.getGameUI().BuildToolGui;
		}

		return this.gui;
	}

	private updateLists(hasAnimations: boolean) {
		if (hasAnimations) {
			GuiAnimator.transition(this.getGui().Selection, 0.1, "right");
		}

		// Remove old buttons
		this.selectionButtons.forEach((button) => {
			button.Destroy();
		});
		this.selectionButtons.clear();

		if (this.selectedCategory === undefined) {
			// Display categories
			CategoriesRegistry.categories.forEach((registeredCategory) => {
				const obj = this.categoryTemplate.Clone();
				obj.TextLabel.Text = registeredCategory.getDisplayName();
				obj.Frame.ImageLabel.Image = `rbxassetid://${registeredCategory.getImageAssetID()}`;
				obj.Parent = this.getGui().Selection.Buttons;
				this.eventHandler.subscribeOnce(obj.MouseButton1Click, () => {
					SoundController.getSounds().GuiClick.Play();
					this.selectedCategory = registeredCategory;
					this.updateLists(true);
				});
				this.selectionButtons.push(obj);
			});
		} else {
			const blocks = BlockRegistry.getBlocksInCategory(this.selectedCategory);

			const backButton = this.categoryTemplate.Clone();
			backButton.TextLabel.Text = "Back";
			backButton.Frame.ImageLabel.Image = "http://www.roblox.com/asset/?id=15252518021";
			backButton.Parent = this.getGui().Selection.Buttons;
			this.eventHandler.subscribeOnce(backButton.MouseButton1Click, () => {
				this.selectedCategory = undefined;

				this.selectedBlock = undefined;
				this.tool.prepareVisual();

				SoundController.getSounds().GuiClick.Play();
				this.updateLists(false);
			});
			this.selectionButtons.push(backButton);

			blocks.forEach((block) => {
				const obj = this.blockTemplate.Clone();
				obj.Name = block.getDisplayName();
				obj.TextLabel.Text = block.getDisplayName();
				if (this.selectedBlock === block) {
					obj.BackgroundColor3 = Color3.fromRGB(106, 106, 106);
				}
				obj.Frame.LimitLabel.Text = "inf";
				obj.Parent = this.getGui().Selection.Buttons;
				this.eventHandler.subscribeOnce(obj.MouseButton1Click, () => {
					this.selectedBlock = block;
					this.tool.prepareVisual();

					this.updateLists(false);
					SoundController.getSounds().GuiClick.Play();
				});
				this.selectionButtons.push(obj);
			});
		}

		this.getGui().Selection.MaterialLabel.Text = this.selectedMaterial.Name;
	}

	protected prepare(): void {
		this.gui.TouchControls.Visible = false;

		// Notice: Resets events
		super.prepare();

		this.updateLists(false);
		this.eventHandler.subscribe(this.gui.Selection.MaterialButton.MouseButton1Click, () => {
			PopupWidgets.ConfirmPopupWidget.display("a", "e", () => {});
		});
	}

	protected prepareDesktop(): void {
		// Empty
	}

	protected prepareGamepad(): void {
		// Empty
	}

	protected prepareTouch(): void {
		this.gui.TouchControls.Visible = true;
		GuiAnimator.transition(this.gui.TouchControls, 0.1, "left");

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

	isVisible(): boolean {
		return this.gui.Visible;
	}
}
