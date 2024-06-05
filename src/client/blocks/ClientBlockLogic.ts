import { Workspace } from "@rbxts/services";
import type { BlockLogic } from "shared/block/BlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export abstract class ClientBlockLogic<T extends new (block: PlacedBlockData) => BlockLogic> {
	readonly logic;

	constructor(logic: T) {
		this.logic = logic;
	}

	protected isValidBlock(block: BlockModel | undefined): boolean {
		if (!block) return false;
		if (!block.IsDescendantOf(Workspace)) return false;

		return true;
	}
}
