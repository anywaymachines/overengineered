import { Workspace } from "@rbxts/services";
import BlockLogic from "shared/block/BlockLogic";
import { PlacedBlockData } from "shared/building/BlockManager";

export default abstract class ServerBlockLogic<T extends new (block: PlacedBlockData) => BlockLogic> {
	readonly logic;

	constructor(logic: T) {
		this.logic = logic;
	}

	protected isValidBlock(block: BlockModel | undefined, player: Player | undefined): boolean {
		if (!block) return false;
		if (!block.IsDescendantOf(Workspace)) return false;
		if (block.PrimaryPart?.Anchored || block.PrimaryPart?.AssemblyRootPart?.Anchored) return false;

		if (player && block.PrimaryPart?.GetNetworkOwner() !== player) {
			return false;
		}

		return true;
	}
}
