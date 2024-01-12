import { GuiService } from "@rbxts/services";
import Control from "client/base/Control";
import { blockList, categoriesRegistry } from "shared/Registry";
import Objects from "shared/_fixes_/objects";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../GuiAnimator";
import { TextButtonControl } from "../controls/Button";

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
	constructor(template: BlockControlDefinition, text: string) {
		super(template);

		this.text.set(text);

		// TODO
		this.gui.AmountLabel.Visible = false;
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	NoResultsLabel: TextLabel;
	ScrollingFrame: ScrollingFrame & {
		BlockButtonTemplate: BlockControlDefinition;
		CategoryButtonTemplate: CategoryControlDefinition;
	};
};

/** Block chooser control */
export default class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	private readonly blockTemplate;
	private readonly categoryTemplate;

	private readonly list;

	public selectedCategory = new ObservableValue<readonly Category[]>([]);
	public selectedBlock = new ObservableValue<Block | undefined>(undefined);

	constructor(template: BlockSelectionControlDefinition) {
		super(template);

		this.list = this.added(new Control<ScrollingFrame, BlockControl | CategoryControl>(this.gui.ScrollingFrame));

		// Prepare templates
		this.blockTemplate = Control.asTemplate(this.gui.ScrollingFrame.BlockButtonTemplate);
		this.categoryTemplate = Control.asTemplate(this.gui.ScrollingFrame.CategoryButtonTemplate);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category), true);
	}

	public createCategoryButton(text: string, activated: () => void) {
		const control = new CategoryControl(this.categoryTemplate(), text);
		control.activated.Connect(activated);
		this.list.add(control);

		return control;
	}

	public createBlockButton(text: string, activated: () => void) {
		const control = new BlockControl(this.blockTemplate(), text);
		control.activated.Connect(activated);
		this.list.add(control);

		return control;
	}

	private create(selected: readonly Category[]) {
		this.list.clear();

		if (selected.size() !== 0) {
			this.createCategoryButton("←", () => {
				this.selectedCategory.set(selected.filter((_, i) => i !== selected.size() - 1));
				this.selectedBlock.set(undefined);
			});
		}

		for (const category of Objects.values(selected.reduce((acc, val) => acc[val].sub, categoriesRegistry))) {
			this.createCategoryButton(category.name, () => this.selectedCategory.set([...selected, category.name]));
		}

		let prev: BlockControl | CategoryControl | undefined;
		for (const block of blockList) {
			if (block.category === this.selectedCategory.get()[this.selectedCategory.get().size() - 1]) {
				const button = this.createBlockButton(block.displayName, () => this.selectedBlock.set(block));

				if (prev) {
					button.getGui().NextSelectionUp = prev.getGui();
					prev.getGui().NextSelectionDown = button.getGui();
				}

				this.event.subscribe(button.activated, () => {
					// Gamepad selection improvements
					GuiService.SelectedObject = undefined;
				});

				this.event.subscribeObservable(
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

		this.gui.NoResultsLabel.Visible = false;

		// Gamepad selection improvements
		const isSelected = GuiService.SelectedObject !== undefined;
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].getGui() : undefined;

		GuiAnimator.transition(this.gui.ScrollingFrame, 0.2, "up", 10);
	}
}
