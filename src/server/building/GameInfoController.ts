import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { BlockIds } from "shared/BlockDataRegistry";
import { HostedService } from "shared/GameHost";
import type { BlockMarkers } from "server/building/BlockMarkersController";
import type { BlockId } from "shared/BlockDataRegistry";

@injectable
export class GameInfoController extends HostedService {
	constructor(@inject blockMarkers: BlockMarkers) {
		super();

		this.onEnable(() => {
			const toBlock = (id: BlockId): GameInfoBlock | undefined => {
				const markerPositions = blockMarkers.markers[id];
				if (markerPositions === undefined) {
					return undefined;
				}

				return { markerPositions };
			};

			const blocks: { [id in BlockId]?: GameInfoBlock } = {};
			for (const id of BlockIds) {
				blocks[id] = toBlock(id);
			}
			const info = { blocks };

			registerOnRemoteFunction("Game", "GameInfo", () => info);
		});
	}
}
