import TestBlock from "shared/registry/blocks/TestBlock";
import AbstractBlock from "./AbstractBlock";

export default class BlockRegistry {
	public static Blocks: Map<string, AbstractBlock> = new Map<string, AbstractBlock>();

	public static readonly TEST_BLOCK = new TestBlock();

	public static initialize() {
		this.Blocks.set(this.TEST_BLOCK.id, this.TEST_BLOCK);
	}
}
