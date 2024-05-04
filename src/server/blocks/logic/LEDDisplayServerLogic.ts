import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { LEDDisplayBlockLogic } from "shared/block/logic/operations/output/LEDDisplayBlockLogic";

export class LEDDisplayServerLogic extends ServerBlockLogic<typeof LEDDisplayBlockLogic> {
	constructor(logic: typeof LEDDisplayBlockLogic) {
		super(logic);

		logic.events.update.invoked.Connect((player, { block, color, part }) => {
			if (!this.isValidBlock(block, player)) return;
			if (!part.IsDescendantOf(block.WaitForChild("Display"))) {
				player?.Kick("ban forev");
				return;
			}

			part.Color = color;
		});
	}
}
