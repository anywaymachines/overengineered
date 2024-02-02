import { GuiService, LocalizationService, Players } from "@rbxts/services";
import Control from "client/gui/Control";
import Registry, { blockList, categoriesRegistry } from "shared/Registry";
import ObservableValue from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import GuiAnimator from "../GuiAnimator";
import { ButtonControl, TextButtonControl } from "../controls/Button";
import BlockPreviewControl from "./BlockPreviewControl";
import MaterialChooserControl from "./MaterialChooser";

type CategoryControlDefinition = GuiButton & {
	ViewportFrame: ViewportFrame;
	TextLabel: TextLabel;
};

/** Category button */
class CategoryControl extends TextButtonControl<CategoryControlDefinition> {
	constructor(template: CategoryControlDefinition, text: string) {
		super(template);

		this.text.set(text);
	}
}

type BlockControlDefinition = GuiButton & {
	ViewportFrame: ViewportFrame;
	AmountLabel: TextLabel;
	TextLabel: TextLabel;
};

/** Block button */
class BlockControl extends TextButtonControl<BlockControlDefinition> {
	constructor(template: BlockControlDefinition, block: Block) {
		super(template);

		this.text.set(block.displayName);
		this.add(new BlockPreviewControl(template.ViewportFrame, block));

		// TODO
		this.gui.AmountLabel.Visible = false;
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	SearchTextBox: TextLabel;
	NoResultsLabel: TextLabel;
	ScrollingFrame: ScrollingFrame & {
		BlockButtonTemplate: BlockControlDefinition;
		CategoryButtonTemplate: CategoryControlDefinition;
	};
	Buttons: {
		Material: TextButton;
		Mirror: TextButton;
	};
};

/** Block chooser control */
export default class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	private readonly blockTemplate;
	private readonly categoryTemplate;

	private readonly list;

	public selectedCategory = new ObservableValue<readonly CategoryName[]>([]);
	public selectedBlock = new ObservableValue<Block | undefined>(undefined);

	constructor(template: BlockSelectionControlDefinition) {
		super(template);

		this.list = this.added(new Control<ScrollingFrame, BlockControl | CategoryControl>(this.gui.ScrollingFrame));

		// Prepare templates
		this.blockTemplate = Control.asTemplate(this.gui.ScrollingFrame.BlockButtonTemplate);
		this.categoryTemplate = Control.asTemplate(this.gui.ScrollingFrame.CategoryButtonTemplate);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category, true), true);

		// might be useful
		// const searchText = this.event.observableFromGuiParam(this.gui.SearchTextBox, "Text");
		this.event.subscribe(this.gui.SearchTextBox.GetPropertyChangedSignal("Text"), () => {
			this.selectedCategory.set([]);
			this.selectedBlock.set(undefined);

			this.create([], false);
		});

		this.add(new ButtonControl(this.gui.Buttons.Material, () => MaterialChooserControl.instance.show()));
	}

	public createCategoryButton(text: string, activated: () => void) {
		const control = new CategoryControl(this.categoryTemplate(), text);
		control.activated.Connect(activated);
		this.list.add(control);

		return control;
	}

	public createBlockButton(block: Block, activated: () => void) {
		const control = new BlockControl(this.blockTemplate(), block);
		control.activated.Connect(activated);
		this.list.add(control);

		return control;
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
		this.list.clear();

		// Back button
		if (selected.size() !== 0) {
			this.createCategoryButton("←", () => {
				this.gui.SearchTextBox.Text = "";

				this.selectedCategory.set(selected.filter((_, i) => i !== selected.size() - 1));
				this.selectedBlock.set(undefined);
			});
		}

		if (this.gui.SearchTextBox.Text === "") {
			// Category buttons
			for (const [_, category] of Objects.pairs(
				selected.reduce((acc, val) => acc[val].sub, categoriesRegistry),
			)) {
				this.createCategoryButton(category.name, () => this.selectedCategory.set([...selected, category.name]));
			}
		}

		// Block buttons
		let prev: BlockControl | CategoryControl | undefined;
		for (const block of blockList) {
			if (
				block.category === this.selectedCategory.get()[this.selectedCategory.get().size() - 1] ||
				(this.gui.SearchTextBox.Text !== "" &&
					this.translate(block.displayName).lower().find(this.gui.SearchTextBox.Text.lower())[0])
			) {
				const button = this.createBlockButton(block, () => {
					if (this.gui.SearchTextBox.Text !== "") {
						this.gui.SearchTextBox.Text = "";
						this.selectedCategory.set(Registry.findCategoryPath(categoriesRegistry, block.category) ?? []);
					}
					this.selectedBlock.set(block);
				});

				if (prev) {
					button.getGui().NextSelectionUp = prev.getGui();
					prev.getGui().NextSelectionDown = button.getGui();
				}

				button.event.subscribe(button.activated, () => {
					// Gamepad selection improvements
					GuiService.SelectedObject = undefined;
				});

				button.event.subscribeObservable(
					this.selectedBlock,
					(newblock) => {
						button.getGui().BackgroundColor3 =
							newblock === block ? Color3.fromRGB(56, 61, 74) : Color3.fromRGB(86, 94, 114);

						// Gamepad selection improvements
						button.getGui().SelectionOrder = newblock === block ? 0 : 1;
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
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].getGui() : undefined;

		if (animated && this.gui.SearchTextBox.Text === "") {
			GuiAnimator.transition(this.gui.ScrollingFrame, 0.2, "up", 10);
			GuiAnimator.transition(this.gui.NoResultsLabel, 0.2, "down", 10);
		}
	}
}
