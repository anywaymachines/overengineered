import Control from "client/base/Control";
import Bindable from "shared/event/ObservableValue";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "shared/registry/abstract/AbstractCategory";
import { ListControl } from "../controls/ListControl";

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

export type BlockChooserControlDefinition = GuiObject & {
	ScrollingFrame: ScrollingFrame & {
		Template: BlockControlDefinition;
	};
};

/** Block chooser control */
export default class BlockChooserControl extends Control<BlockChooserControlDefinition> {
	private readonly blocks;
	private readonly categories;

	private readonly itemTemplate;
	private readonly list;
	private readonly selectedCategory = new Bindable<AbstractCategory | undefined>(undefined);

	constructor(
		template: BlockChooserControlDefinition,
		blocks: readonly AbstractBlock[],
		categories: readonly AbstractCategory[],
	) {
		super(template);

		this.blocks = blocks;
		this.categories = categories;

		this.list = new ListControl(this.gui.ScrollingFrame);

		// Prepare templates
		this.itemTemplate = Control.asTemplate(this.gui.ScrollingFrame.Template);

		this.selectedCategory.subscribe(this.eventHandler, (category) => this.create(category), true);
	}

	private create(category: AbstractCategory | undefined) {
		const createPart = (text: string, activated: () => void) => {
			const control = new ButtonControl(this.itemTemplate(), text);
			control.setVisible(true);
			control.activated.Connect(activated);

			this.list.add(control);
		};

		this.list.clear();

		if (!category) {
			this.categories.forEach((cat) => createPart(cat.getDisplayName(), () => this.selectedCategory.set(cat)));
		} else {
			createPart("Back", () => this.selectedCategory.set(undefined));

			this.blocks
				.filter((block) => block.getCategory() === category)
				.forEach((block) =>
					createPart(block.getDisplayName(), () => {
						print("selected " + block);
					}),
				);
		}
	}
}
