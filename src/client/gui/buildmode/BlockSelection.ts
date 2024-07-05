import { ContentProvider, GuiService, Players } from "@rbxts/services";
import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ObservableValue } from "shared/event/ObservableValue";
import { Localization } from "shared/Localization";
import type { BlockRegistry } from "shared/block/BlockRegistry";

type CategoryControlDefinition = GuiButton & {
	readonly ViewportFrame: ViewportFrame;
	readonly TextLabel: TextLabel;
};
class CategoryControl extends TextButtonControl<CategoryControlDefinition> {
	constructor(template: CategoryControlDefinition, text: string, blocks: readonly BlockModel[]) {
		super(template);
		this.text.set(text);

		if (blocks.size() !== 0) {
			const preview = this.add(new BlockPreviewControl(template.ViewportFrame));
			let blockIndex = 0;

			const update = () => preview.set(blocks[blockIndex++ % blocks.size()]);
			this.onEnable(update);
			this.event.loop(1, update);
		}
	}
}

type BlockControlDefinition = GuiButton & {
	readonly ViewportFrame: ViewportFrame;
	readonly TextLabel: TextLabel;
};
class BlockControl extends TextButtonControl<BlockControlDefinition> {
	constructor(template: BlockControlDefinition, block: RegistryBlock) {
		super(template);

		this.text.set(block.displayName);
		this.add(new BlockPreviewControl(template.ViewportFrame, block.model));
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	readonly SearchTextBox: TextBox;
	readonly NoResultsLabel: TextLabel;
	readonly Content: {
		readonly ScrollingFrame: ScrollingFrame & {
			readonly BackButtonTemplate: CategoryControlDefinition;
			readonly BlockButtonTemplate: BlockControlDefinition;
			readonly CategoryButtonTemplate: CategoryControlDefinition;
		};
	};
	readonly Header: {
		readonly Pipette: GuiButton;
	};
	readonly Breadcrumbs: GuiObject & {
		readonly Content: ScrollingFrame & {
			readonly PathTemplate: TextButton;
		};
	};
};

/** Block chooser control */
@injectable
export class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	private readonly backTemplate;
	private readonly blockTemplate;
	private readonly categoryTemplate;
	private readonly breadcrumbTemplate;
	private readonly list;

	readonly selectedCategory = new ObservableValue<CategoryPath>([]);
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);
	readonly targetBlock = new ObservableValue<BlockId | undefined>(undefined);

	readonly pipette;
	private readonly breadcrumbs;

	constructor(
		template: BlockSelectionControlDefinition,
		@inject readonly blockRegistry: BlockRegistry,
	) {
		super(template);

		this.list = this.add(
			new Control<ScrollingFrame, BlockControl | CategoryControl>(this.gui.Content.ScrollingFrame),
		);

		this.breadcrumbs = this.add(new Control<ScrollingFrame, TextButtonControl>(this.gui.Breadcrumbs.Content));
		this.breadcrumbTemplate = this.asTemplate(this.gui.Breadcrumbs.Content.PathTemplate);

		// Prepare templates
		this.backTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.BackButtonTemplate);
		this.blockTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.BlockButtonTemplate);
		this.categoryTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.CategoryButtonTemplate);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category, true), true);

		this.pipette = this.add(
			BlockPipetteButton.forBlockId(this.gui.Header.Pipette, (id) => {
				this.selectedBlock.set(blockRegistry.blocks.get(id));
				this.selectedCategory.set(this.selectedBlock.get()!.category);
			}),
		);

		// might be useful
		// const searchText = this.event.observableFromGuiParam(this.gui.SearchTextBox, "Text");
		this.event.subscribe(this.gui.SearchTextBox.GetPropertyChangedSignal("Text"), () => {
			this.selectedCategory.set([]);
			this.selectedBlock.set(undefined);

			this.create([], false);
		});
	}

	private create(selectedCategory: CategoryPath, animated: boolean) {
		let idx = 0;

		const createBackButton = (activated: () => void) => {
			const control = new TextButtonControl(this.backTemplate(), activated);
			this.list.add(control);

			// Highlight if needed
			if (this.targetBlock.get()) {
				const drawHighlight = () => {
					Gui.getTemplates<{ Highlight: GuiObject }>().Highlight.Clone().Parent = control.instance;
				};

				const targetCategory = this.blockRegistry.blocks.get(this.targetBlock.get()!)!.category;

				if (targetCategory.size() < selectedCategory.size()) {
					drawHighlight();
				}

				for (let i = 0; i < targetCategory.size(); i++) {
					if (!selectedCategory[i]) break;

					if (selectedCategory[i] !== targetCategory[i]) {
						drawHighlight();
						break;
					}
				}
			}

			control.instance.LayoutOrder = idx++;
			return control;
		};

		const createCategoryButton = (category: CategoryPath, activated: () => void) => {
			const blocks = this.blockRegistry
				.getBlocksByCategoryRecursive(category)
				.map((b) => b.model)
				.sort((l, r) => tostring(l) > tostring(r));

			task.spawn(() => ContentProvider.PreloadAsync(blocks));

			const control = new CategoryControl(this.categoryTemplate(), category[category.size() - 1], blocks);
			control.activated.Connect(activated);
			this.list.add(control);

			// Highlight if needed
			if (this.targetBlock.get()) {
				const targetCategory = this.blockRegistry.blocks.get(this.targetBlock.get()!)!.category;

				if (
					selectedCategory.size() < targetCategory.size() &&
					selectedCategory[selectedCategory.size() - 1] === targetCategory[selectedCategory.size() - 1] &&
					category[category.size() - 1] === targetCategory[targetCategory.size() - 1]
				) {
					Gui.getTemplates<{ Highlight: GuiObject }>().Highlight.Clone().Parent = control.instance;
				}
			}

			control.instance.LayoutOrder = idx++;
			return control;
		};

		const createBlockButton = (block: RegistryBlock, activated: () => void) => {
			const control = new BlockControl(this.blockTemplate(), block);
			control.activated.Connect(activated);
			this.list.add(control);

			control.instance.LayoutOrder = idx++;
			return control;
		};

		this.list.clear();

		const addSlashBreadcrumb = () => {
			const control = this.breadcrumbs.add(new TextButtonControl(this.breadcrumbTemplate()));
			control.text.set("/");
			control.instance.Interactable = false;
		};

		this.breadcrumbs.clear();
		addSlashBreadcrumb();
		for (let i = 0; i < selectedCategory.size(); i++) {
			const path: CategoryPath = selectedCategory.move(0, i, 0, []);
			const control = this.breadcrumbs.add(
				new TextButtonControl(this.breadcrumbTemplate(), () => this.selectedCategory.set(path)),
			);
			control.text.set(selectedCategory[i]);

			if (i < selectedCategory.size() - 1) {
				addSlashBreadcrumb();
			}
		}
		this.breadcrumbs.instance.CanvasPosition = new Vector2(this.breadcrumbs.instance.AbsoluteCanvasSize.X, 0);

		// Back button
		if (selectedCategory.size() !== 0) {
			createBackButton(() => {
				this.gui.SearchTextBox.Text = "";
				this.selectedCategory.set(selectedCategory.filter((_, i) => i !== selectedCategory.size() - 1));
			});
		}

		// Block buttons
		let prev: BlockControl | CategoryControl | undefined;

		const lowerSearch = this.gui.SearchTextBox.Text.fullLower();
		const blocks =
			this.gui.SearchTextBox.Text === ""
				? this.blockRegistry.getBlocksByCategory(this.selectedCategory.get())
				: this.blockRegistry.sorted.filter(
						(block) =>
							block.displayName.fullLower().find(lowerSearch)[0] !== undefined ||
							Localization.translateForPlayer(Players.LocalPlayer, block.displayName)
								.fullLower()
								.find(lowerSearch, undefined, true)[0] !== undefined,
					);

		for (const block of blocks) {
			const button = createBlockButton(block, () => {
				if (this.gui.SearchTextBox.Text !== "") {
					this.gui.SearchTextBox.Text = "";
					this.selectedCategory.set(block.category);
				}
				this.selectedBlock.set(block);
			});

			if (prev) {
				button.instance.NextSelectionUp = prev.instance;
				prev.instance.NextSelectionDown = button.instance;
			}

			button.event.subscribe(button.activated, () => {
				// Gamepad selection improvements
				GuiService.SelectedObject = undefined;
			});

			button.event.subscribeObservable(
				this.selectedBlock,
				(newblock) => {
					button.instance.BackgroundColor3 = newblock === block ? Colors.accentDark : Colors.staticBackground;

					if (block.id === this.targetBlock.get() && newblock?.id !== this.targetBlock.get()) {
						button.instance.FindFirstChild("Highlight")?.Destroy();
						Gui.getTemplates<{ Highlight: GuiObject }>().Highlight.Clone().Parent = button.instance;
					} else {
						button.instance.FindFirstChild("Highlight")?.Destroy();
					}

					// Gamepad selection improvements
					button.instance.SelectionOrder = newblock === block ? 0 : 1;
				},
				true,
				true,
			);

			prev = button;
		}

		if (this.gui.SearchTextBox.Text === "") {
			// Category buttons
			for (const category of asMap(
				this.blockRegistry.getCategoryByPath(selectedCategory)?.sub ?? this.blockRegistry.categories,
			)
				.values()
				.sort((l, r) => l.name < r.name)) {
				createCategoryButton(category.path, () =>
					this.selectedCategory.set([...selectedCategory, category.name]),
				);
			}
		}

		// No results label for searching menu
		this.gui.NoResultsLabel.Visible = this.gui.SearchTextBox.Text !== "" && this.list.getChildren().size() === 0;

		// Gamepad selection improvements
		const isSelected = GuiService.SelectedObject !== undefined;
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].instance : undefined;

		if (animated && this.gui.SearchTextBox.Text === "") {
			GuiAnimator.transition(this.gui.Content.ScrollingFrame, 0.2, "up", 10);
			GuiAnimator.transition(this.gui.NoResultsLabel, 0.2, "down", 10);
		}
	}
}
