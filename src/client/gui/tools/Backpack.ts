import Control from "client/base/Control";
import Widget from "client/base/Widget";
import SoundController from "client/controller/SoundController";
import Bindable from "shared/event/ObservableValue";
import BlockRegistry from "shared/registry/BlocksRegistry";
import CategoriesRegistry from "shared/registry/CategoriesRegistry";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "shared/registry/abstract/AbstractCategory";
import TabControl, { TabControlDefinition } from "../controls/TabControl";

type BackpackDefinition = Frame & {
	Buttons: ScrollingFrame & {
		BlockTemplate: TextButton & { Frame: Frame & { LimitLabel: TextLabel }; TextLabel: TextLabel };
		CategoryTemplate: TextButton & { Frame: Frame & { ImageLabel: ImageLabel }; TextLabel: TextLabel };
	};
	MaterialButton: TextButton;
	MaterialLabel: TextLabel;

	Tabs: TabControlDefinition & {
		Contents: {
			Template: Frame & {
				BlockTemplate: Frame & {};
			};
		};
	};
};

/** Backpack control */
/*
export default class BackpackControl extends Control<BackpackDefinition> {
	public readonly selectedBlock;
	public readonly selectedMaterial;

	private readonly blocks;
	private readonly categories;

	private readonly categoryTemplate;
	private readonly blockTemplate;
	private readonly tabTemplate;
	private readonly contentsTemplate;

	private readonly tabControl;

	// Menu selection
	private selectionButtons: TextButton[] = [];

	constructor(gui: BackpackDefinition, blocks: readonly AbstractBlock[], categories: readonly AbstractCategory[]) {
		super(gui);

		this.blocks = blocks;
		this.categories = categories;

		this.selectedBlock = new Bindable<AbstractBlock | undefined>(blocks[0]);
		this.selectedMaterial = new Bindable<Enum.Material>(Enum.Material.Plastic);

		// Prepare templates
		this.categoryTemplate = this.gui.Buttons.CategoryTemplate.Clone();
		this.blockTemplate = this.gui.Buttons.BlockTemplate.Clone();
		this.contentsTemplate = this.gui.Tabs.Contents.Template.Clone();
		this.gui.Buttons.CategoryTemplate.Destroy();
		this.gui.Buttons.BlockTemplate.Destroy();

		this.tabControl = new TabControl(this.gui.Tabs);

		this.selectedMaterial.subscribe(
			this.eventHandler,
			(material) => (this.gui.MaterialLabel.Text = material.Name),
			true,
		);

		this.create();
	}

	private create() {
		const createTab = (category: AbstractCategory) => {
			const content = this.contentsTemplate.Clone();

			this.tabControl.addTab(category.getDisplayName(), content);

			const tab = this.gui.TabTemplate.Clone();
			tab.Text.Text = category.getDisplayName();

			tab.Parent = tab;
		};

		this.categories.forEach(createTab);
	}

	private updateLists() {
		// Remove old buttons
		this.selectionButtons.forEach((button) => button.Destroy());
		this.selectionButtons.clear();

		if (this.selectedCategory.get() === undefined) {
			// Display categories
			CategoriesRegistry.categories.forEach((registeredCategory) => {
				const obj = this.categoryTemplate.Clone();
				obj.TextLabel.Text = registeredCategory.getDisplayName();
				obj.Frame.ImageLabel.Image = `rbxassetid://${registeredCategory.getImageAssetID()}`;
				obj.Parent = this.gui.Buttons;
				this.eventHandler.subscribeOnce(obj.MouseButton1Click, () => {
					SoundController.getSounds().GuiClick.Play();
					this.selectedCategory.set(registeredCategory);
					this.updateLists();
				});
				this.selectionButtons.push(obj);
			});
		} else {
			const blocks = BlockRegistry.getBlocksInCategory(this.selectedCategory.get());

			const backButton = this.categoryTemplate.Clone();
			backButton.TextLabel.Text = "Back";
			backButton.Frame.ImageLabel.Image = "http://www.roblox.com/asset/?id=15252518021";
			backButton.Parent = this.gui.Buttons;
			this.eventHandler.subscribeOnce(backButton.MouseButton1Click, () => {
				this.selectedCategory.set(undefined);
				this.selectedBlock.set(undefined);

				SoundController.getSounds().GuiClick.Play();
				this.updateLists();
			});
			this.selectionButtons.push(backButton);

			blocks.forEach((block) => {
				const obj = this.blockTemplate.Clone();
				obj.Name = block.getDisplayName();
				obj.TextLabel.Text = block.getDisplayName();
				if (this.selectedBlock.get() === block) {
					obj.BackgroundColor3 = Color3.fromRGB(106, 106, 106);
				}

				obj.Frame.LimitLabel.Text = "inf";
				obj.Parent = this.gui.Buttons;
				this.eventHandler.subscribeOnce(obj.MouseButton1Click, () => {
					this.selectedBlock.set(block);

					this.updateLists();
					SoundController.getSounds().GuiClick.Play();
				});
				this.selectionButtons.push(obj);
			});
		}
	}
}
*/
