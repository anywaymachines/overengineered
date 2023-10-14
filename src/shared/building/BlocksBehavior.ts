import Logger from "shared/Logger";
import GameDefinitions from "shared/definitions/GameDefinitions";

export default class BlocksBehavior {
	private static BLOCKS = new Array<Block>();

	static initialize() {
		Logger.info("[BlocksBehavior] Initializing blocks..");
		this.registerNativeBlocks();
	}

	/** The function returns a block based on its Name, which is the argument
	 * @param name The name of the block
	 */
	public static getBlockByName(name: string): Block | undefined {
		return this.BLOCKS.find((block) => block.name === name);
	}

	/** Checking that a block exists is usually required to verify that a player is not cheating */
	public static blockExists(id: string): boolean {
		return this.getBlockByName(id) !== undefined;
	}

	/** The function registers all blocks that have been specified in **GameDefinitions** */
	private static registerNativeBlocks() {
		GameDefinitions.NativeBlocks.forEach((block) => {
			this.BLOCKS.push(block);
		});
	}
}
