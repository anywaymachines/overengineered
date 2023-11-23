import Control from "client/base/Control";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "shared/registry/abstract/AbstractCategory";
import { ListControl } from "../controls/ListControl";
import GuiAnimator from "../GuiAnimator";
import SoundController from "client/controller/SoundController";

type BlockControlDefinition = GuiButton & {
	TextLabel: TextLabel;
};

/** Control for choosing a block or a category */
class ButtonControl extends Control<BlockControlDefinition> {
	public readonly activated;

	constructor(template: BlockControlDefinition, text: string) {
		super(template);

		this.activated = this.gui.Activated;
		this.gui.TextLabel.Text = text;
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	ScrollingFrame: ScrollingFrame & {
		Template: BlockControlDefinition;
	};
};

/** Block chooser control */
export default class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	public readonly selectedBlock = new ObservableValue<AbstractBlock | undefined>(undefined);

	private readonly blocks;
	private readonly categories;

	private readonly itemTemplate;
	private readonly list;
	private readonly selectedCategory = new ObservableValue<AbstractCategory | undefined>(undefined);

	constructor(
		template: BlockSelectionControlDefinition,
		blocks: readonly AbstractBlock[],
		categories: readonly AbstractCategory[],
	) {
		super(template);

		this.blocks = blocks;
		this.categories = categories;

		this.list = new ListControl(this.gui.ScrollingFrame);
		this.add(this.list);

		// Prepare templates
		this.itemTemplate = Control.asTemplate(this.gui.ScrollingFrame.Template);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category), true);
	}

	private create(category: AbstractCategory | undefined) {
		const createPart = (text: string, activated: () => void) => {
			const control = new ButtonControl(this.itemTemplate(), text);
			control.setVisible(true);
			control.activated.Connect(activated);

			this.list.add(control);
			return control;
		};

		this.list.clear();

		if (!category) {
			this.categories.forEach((cat) => createPart(cat.getDisplayName(), () => this.selectedCategory.set(cat)));
		} else {
			createPart("← Back ←", () => this.selectedCategory.set(undefined));

			this.blocks
				.filter((block) => block.getCategory() === category)
				.forEach((block) => {
					const b = createPart(block.getDisplayName(), () => this.selectedBlock.set(block));

					this.event.subscribeObservable(
						this.selectedBlock,
						(newblock) =>
							(b.getGui().BackgroundColor3 =
								newblock === block ? Color3.fromRGB(56, 61, 74) : Color3.fromRGB(86, 94, 114)),
						true,
					);
				});
		}

		GuiAnimator.transition(this.gui.ScrollingFrame, 0.2, "up", 10);
		SoundController.getSounds().Click.Play();
	}
}
