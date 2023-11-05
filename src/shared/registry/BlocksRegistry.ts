import TestBlock from "shared/registry/blocks/TestBlock";
import AbstractBlock from "./abstract/AbstractBlock";
import AbstractCategory from "./abstract/AbstractCategory";

export default class BlockRegistry {
	public static Blocks: Map<string, AbstractBlock> = new Map<string, AbstractBlock>();
	public static RegisteredBlocks: AbstractBlock[] = [];

	public static readonly TEST_BLOCK = this.registerBlock(new TestBlock());

	private static registerBlock(block: AbstractBlock): AbstractBlock {
		this.Blocks.set(block.id, block);
		this.RegisteredBlocks.push(block);
		return block;
	}

	public static getBlocksInCategory(category: AbstractCategory): AbstractBlock[] {
		const approved: AbstractBlock[] = [];
		for (let i = 0; i < BlockRegistry.Blocks.size(); i++) {
			const block = BlockRegistry.RegisteredBlocks[i];
			if (block.getCategory() === category) {
				approved.push(block);
			}
		}
		return approved;
	}
}
