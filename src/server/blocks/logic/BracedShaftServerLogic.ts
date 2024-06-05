import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BracedShaftBlockLogic } from "shared/block/logic/BracedShaftBlockLogic";

@injectable
export class BracedShaftServerLogic extends ServerBlockLogic<typeof BracedShaftBlockLogic> {
	constructor(logic: typeof BracedShaftBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.init.invoked.Connect((player, { block, angle }) => {
			if (!this.isValidBlock(block, player)) return;
			logic.init(block, angle);
		});
	}
}
