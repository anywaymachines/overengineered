import ScreenBlockLogic from "shared/block/logic/operations/output/ScreenBlockLogic";
import ServerBlockLogic from "../ServerBlockLogic";

export default class ScreenServerLogic extends ServerBlockLogic<typeof ScreenBlockLogic> {
	constructor(logic: typeof ScreenBlockLogic) {
		super(logic);

		logic.events.update.invoked.Connect((player, { block, text }) => {
			if (!this.isValidBlock(block, player)) return;
			block.Part.SurfaceGui.TextLabel.Text = text;
		});
	}
}
