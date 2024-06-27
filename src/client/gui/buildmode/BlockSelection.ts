import { GuiService, LocalizationService, Players } from "@rbxts/services";
import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ObservableValue } from "shared/event/ObservableValue";
import type { BlockRegistry } from "shared/block/BlockRegistry";

type CategoryControlDefinition = TextButton;
class CategoryControl extends TextButtonControl<CategoryControlDefinition> {
	constructor(template: CategoryControlDefinition, text: string) {
		super(template);

		this.text.set(text);
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
	readonly PathTextLabel: TextLabel;
	readonly ScrollingFrame: ScrollingFrame & {
		readonly BlockButtonTemplate: BlockControlDefinition;
		readonly CategoryButtonTemplate: CategoryControlDefinition;
	};
	readonly Header: {
		readonly Pipette: GuiButton;
	};
};

/** Block chooser control */
@injectable
export class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	private readonly blockTemplate;
	private readonly categoryTemplate;
	private readonly list;

	readonly selectedCategory = new ObservableValue<readonly CategoryName[]>([]);
	readonly selectedBlock = new ObservableValue<RegistryBlock | undefined>(undefined);

	readonly pipette;

	constructor(
		template: BlockSelectionControlDefinition,
		@inject readonly blockRegistry: BlockRegistry,
	) {
		super(template);

		this.list = this.add(new Control<ScrollingFrame, BlockControl | CategoryControl>(this.gui.ScrollingFrame));

		// Prepare templates
		this.blockTemplate = this.asTemplate(this.gui.ScrollingFrame.BlockButtonTemplate);
		this.categoryTemplate = this.asTemplate(this.gui.ScrollingFrame.CategoryButtonTemplate);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category, true), true);

		this.pipette = this.add(
			BlockPipetteButton.forBlockId(this.gui.Header.Pipette, (id) => {
				this.selectedBlock.set(blockRegistry.blocks.get(id));
				this.selectedCategory.set(blockRegistry.getCategoryPath(this.selectedBlock.get()!.category) ?? []);
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

	private translate(text: string) {
		try {
			const translator = LocalizationService.GetTranslatorForLocaleAsync(Players.LocalPlayer.LocaleId);
			return translator.Translate(game, text);
		} catch {
			return text;
		}
	}

	private create(selected: readonly CategoryName[], animated: boolean) {
		let idx = 0;

		const createCategoryButton = (text: string, activated: () => void) => {
			const control = new CategoryControl(this.categoryTemplate(), text);
			control.activated.Connect(activated);
			this.list.add(control);

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
		this.gui.PathTextLabel.Text = selected.join(" > ");

		// Back button
		if (selected.size() !== 0) {
			createCategoryButton("←", () => {
				this.gui.SearchTextBox.Text = "";

				this.selectedCategory.set(selected.filter((_, i) => i !== selected.size() - 1));
				this.selectedBlock.set(undefined);
			});
		}

		if (this.gui.SearchTextBox.Text === "") {
			// Category buttons
			for (const [_, category] of pairs(
				selected.reduce((acc, val) => acc[val].sub, this.blockRegistry.categories),
			)) {
				createCategoryButton(category.name, () => this.selectedCategory.set([...selected, category.name]));
			}
		}

		// Block buttons
		let prev: BlockControl | CategoryControl | undefined;
		for (const block of this.blockRegistry.sorted) {
			if (
				block.category === this.selectedCategory.get()[this.selectedCategory.get().size() - 1] ||
				(this.gui.SearchTextBox.Text !== "" &&
					this.translate(block.displayName)
						.fullLower()
						.find(this.gui.SearchTextBox.Text.fullLower(), undefined, true)[0])
			) {
				const button = createBlockButton(block, () => {
					if (this.gui.SearchTextBox.Text !== "") {
						this.gui.SearchTextBox.Text = "";
						this.selectedCategory.set(this.blockRegistry.getCategoryPath(block.category) ?? []);
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
						button.instance.BackgroundColor3 =
							newblock === block ? Colors.accentDark : Colors.staticBackground;

						// Gamepad selection improvements
						button.instance.SelectionOrder = newblock === block ? 0 : 1;
					},
					true,
				);

				prev = button;
			}
		}

		// No results label for searching menu
		this.gui.NoResultsLabel.Visible = this.gui.SearchTextBox.Text !== "" && this.list.getChildren().size() === 0;

		// Gamepad selection improvements
		const isSelected = GuiService.SelectedObject !== undefined;
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].instance : undefined;

		if (animated && this.gui.SearchTextBox.Text === "") {
			GuiAnimator.transition(this.gui.ScrollingFrame, 0.2, "up", 10);
			GuiAnimator.transition(this.gui.NoResultsLabel, 0.2, "down", 10);
		}
	}
}
