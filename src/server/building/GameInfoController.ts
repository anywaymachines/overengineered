import { registerOnRemoteFunction } from "server/network/event/RemoteHandler";
import { BlockIds } from "shared/BlockDataRegistry";
import { Controller } from "shared/component/Controller";
import type { BlockMarkersController } from "server/building/BlockMarkersController";
import type { BlockId } from "shared/BlockDataRegistry";

@injectable
export class GameInfoController extends Controller {
	readonly info: GameInfo;

	constructor(@inject blockMarkers: BlockMarkersController) {
		super();

		const toBlock = (id: BlockId): GameInfoBlock | undefined => {
			const markerPositions = blockMarkers.markers[id];
			if (markerPositions === undefined) {
				return undefined;
			}

			return {
				markerPositions,
			};
		};

		const blocks: { [id in BlockId]?: GameInfoBlock } = {};
		for (const id of BlockIds) {
			blocks[id] = toBlock(id);
		}
		this.info = { blocks };

		registerOnRemoteFunction("Game", "GameInfo", () => this.info);
	}
}
