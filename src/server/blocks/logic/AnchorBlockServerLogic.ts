import ServerPartUtils from "server/plots/ServerPartUtils";
import AnchorBlockLogic from "shared/block/logic/AnchorBlockLogic";
import ServerBlockLogic from "server/blocks/ServerBlockLogic";

export default class AnchorBlockServerLogic extends ServerBlockLogic<typeof AnchorBlockLogic> {
	constructor(logic: typeof AnchorBlockLogic) {
		super(logic);

		logic.events.anchor.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;

			ServerPartUtils.switchDescendantsAnchor(block, true);
		});
	}
}
