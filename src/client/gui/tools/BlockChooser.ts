import Control from "client/base/Control";
import Bindable from "shared/Bindable";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";

export type BlockControlDefinition = GuiObject & {
	BlockName: TextLabel;
};

/** Block control for choosing */
class BlockControl extends Control<BlockControlDefinition> {
	private readonly block;

	constructor(template: BlockControlDefinition, block: AbstractBlock) {
		super(template);

		this.block = block;
		print(this.gui.BlockName);
		this.gui.BlockName.Text = block.getDisplayName();
	}
}

export type BlockChooserControlDefinition = ScrollingFrame & {
	BlockTemplate: BlockControlDefinition;
};

/** Block chooser control */
export default class BlockChooserControl extends Control<BlockChooserControlDefinition> {
	public readonly selectedBlock;
	private readonly blocks;
	private readonly blockTemplate;

	constructor(template: BlockChooserControlDefinition, blocks: readonly AbstractBlock[]) {
		super(template);

		this.blocks = blocks;
		this.selectedBlock = new Bindable<AbstractBlock | undefined>(blocks[0]);

		// Prepare templates
		this.blockTemplate = this.gui.BlockTemplate.Clone();
		this.gui.BlockTemplate.Destroy();

		this.create();
	}

	private create() {
		const createBlock = (block: AbstractBlock) => {
			const control = new BlockControl(this.blockTemplate, block);
			control.setVisible(true);
			control.setParent(this.gui);
		};

		this.blocks.forEach(createBlock);
	}
}
