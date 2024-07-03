import { HostedService } from "shared/GameHost";
import { CustomRemotes } from "shared/Remotes";
import type { BlockRegistry } from "shared/block/BlockRegistry";

@injectable
export class GameInfoController extends HostedService {
	constructor(@inject blockRegistry: BlockRegistry) {
		super();

		this.onEnable(() => {
			CustomRemotes.getGameInfo.subscribe(() => ({
				success: true,

				blocks: blockRegistry.sorted,
				categories: blockRegistry.categories,
			}));
		});
	}
}
