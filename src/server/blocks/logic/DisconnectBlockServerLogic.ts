import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { DisconnectBlockLogic } from "shared/block/logic/DisconnectBlockLogic";

export class DisconnectBlockServerLogic extends ServerBlockLogic<typeof DisconnectBlockLogic> {
	constructor(logic: typeof DisconnectBlockLogic) {
		super(logic);

		logic.events.disconnect.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;

			(block.FindFirstChild("Ejector") as Part | undefined)?.Destroy();
		});
	}
}
