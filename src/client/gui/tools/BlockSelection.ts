import { GuiService } from "@rbxts/services";
import Control from "client/base/Control";
import SoundController from "client/controller/SoundController";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../GuiAnimator";
import { TextButtonControl } from "../controls/Button";

type BlockControlDefinition = GuiButton & {
	TextLabel: TextLabel;
};

/** Control for choosing a block or a category */
class SelectorControl extends TextButtonControl<BlockControlDefinition> {
	constructor(template: BlockControlDefinition, text: string) {
		super(template);

		this.text.set(text);
		this.event.subscribe(this.gui.Activated, () => SoundController.getSounds().Click.Play());
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	ScrollingFrame: ScrollingFrame & {
		Template: BlockControlDefinition;
	};
};

/** Block chooser control */
export default class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	public readonly selectedBlock = new ObservableValue<Block | undefined>(undefined);

	private readonly blocks;
	private readonly categories;

	private readonly itemTemplate;
	private readonly list;
	private readonly selectedCategory = new ObservableValue<Category | undefined>(undefined);

	private readonly backButtonText = "← Back ←";

	constructor(template: BlockSelectionControlDefinition, blocks: readonly Block[], categories: readonly Category[]) {
		super(template);

		this.blocks = blocks;
		this.categories = categories;

		this.list = new Control<GuiObject, SelectorControl>(this.gui.ScrollingFrame);
		this.add(this.list);

		// Prepare templates
		this.itemTemplate = Control.asTemplate(this.gui.ScrollingFrame.Template);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category), true);
	}

	private create(category: Category | undefined) {
		const createPart = (text: string, activated: () => void) => {
			const control = new SelectorControl(this.itemTemplate(), text);
			control.show();
			control.activated.Connect(activated);
			control.activated.Connect(() => SoundController.getSounds().Click.Play());

			this.list.add(control);
			return control;
		};

		const isSelected = GuiService.SelectedObject !== undefined;
		this.list.clear();

		if (category === undefined) {
			this.categories.forEach((cat) => createPart(cat, () => this.selectedCategory.set(cat)));
		} else {
			createPart(this.backButtonText, () => {
				this.selectedBlock.set(undefined);
				this.selectedCategory.set(undefined);
			});

			let prev: SelectorControl | undefined;
			this.blocks
				.filter((block) => block.category === category)
				.forEach((block) => {
					const b = createPart(block.displayName, () => this.selectedBlock.set(block));
					if (prev) {
						b.getGui().NextSelectionUp = prev.getGui();
						prev.getGui().NextSelectionDown = b.getGui();
					}
					prev = b;

					// Block press event
					this.event.subscribe(b.activated, () => {
						// Gamepad selection improvements
						GuiService.SelectedObject = undefined;
					});

					this.event.subscribeObservable(
						this.selectedBlock,
						(newblock) => {
							b.getGui().BackgroundColor3 =
								newblock === block ? Color3.fromRGB(56, 61, 74) : Color3.fromRGB(86, 94, 114);

							// Gamepad selection improvements
							b.getGui().SelectionOrder = newblock === block ? 0 : 1;
						},
						true,
					);
				});
		}

		// Gamepad selection improvements
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].getGui() : undefined;

		GuiAnimator.transition(this.gui.ScrollingFrame, 0.2, "up", 10);
	}
}
