import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { DisconnectBlockLogic } from "shared/block/logic/DisconnectBlockLogic";

@injectable
export class DisconnectBlockServerLogic extends ServerBlockLogic<typeof DisconnectBlockLogic> {
	constructor(logic: typeof DisconnectBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.disconnect.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;

			(block.FindFirstChild("Ejector") as Part | undefined)?.Destroy();
		});
	}
}
