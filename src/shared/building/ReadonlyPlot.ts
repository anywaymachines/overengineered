import { BlockManager } from "shared/building/BlockManager";
import type { PlacedBlockData } from "shared/building/BlockManager";
import type { BB } from "shared/fixes/BB";

/** Reading a plot. */
@injectable
export class ReadonlyPlot {
	constructor(
		protected readonly instance: Instance,
		readonly origin: CFrame,
		readonly boundingBox: BB,
	) {}

	getBlocks(): readonly BlockModel[] {
		return this.instance.GetChildren() as unknown as readonly BlockModel[];
	}
	getBlockDatas(): readonly PlacedBlockData[] {
		return this.getBlocks().map(BlockManager.getBlockDataByBlockModel);
	}
	getBlock(uuid: BlockUuid): BlockModel {
		return (this.instance as unknown as Record<BlockUuid, BlockModel>)[uuid];
	}
	tryGetBlock(uuid: BlockUuid): BlockModel | undefined {
		return this.instance.FindFirstChild(uuid) as BlockModel | undefined;
	}
}
