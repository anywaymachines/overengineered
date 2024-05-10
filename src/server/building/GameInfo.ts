import { BlockMarkers } from "server/building/BlockMarkers";
import { BlockId, BlockIds } from "shared/BlockDataRegistry";

export namespace GameInfo {
	function toBlock(id: BlockId): GameInfoBlock | undefined {
		const markerPositions = BlockMarkers.markers[id];
		if (markerPositions === undefined) {
			return undefined;
		}

		return {
			markerPositions,
		};
	}

	const blocks: { [id in BlockId]?: GameInfoBlock } = {};
	for (const id of BlockIds) {
		blocks[id] = toBlock(id);
	}

	export const info: GameInfo = {
		blocks,
	};
}
