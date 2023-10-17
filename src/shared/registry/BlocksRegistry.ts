import TestBlock from "shared/registry/blocks/TestBlock";
import Block from "./Block";

export default class BlockRegistry {
	public static Blocks: Map<string, Block> = new Map<string, Block>();

	public static TEST_BLOCK = new TestBlock();

	public static initialize() {
		this.Blocks.set(this.TEST_BLOCK.id, this.TEST_BLOCK);
	}
}
