import { TextService } from "@rbxts/services";
import ServerBlockLogic from "server/blocks/ServerBlockLogic";
import ScreenBlockLogic from "shared/block/logic/operations/output/ScreenBlockLogic";

export default class ScreenServerLogic extends ServerBlockLogic<typeof ScreenBlockLogic> {
	constructor(logic: typeof ScreenBlockLogic) {
		super(logic);

		logic.events.update.invoked.Connect((player, { block, text, translate }) => {
			if (!this.isValidBlock(block, player)) return;

			if (translate && player) {
				text = TextService.FilterStringAsync(text, player.UserId).GetNonChatStringForBroadcastAsync();
			}

			block.Part.SurfaceGui.TextLabel.Text = text;
		});
	}
}
