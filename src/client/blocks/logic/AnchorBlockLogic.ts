import BlockLogic from "client/base/BlockLogic";
import Remotes from "shared/Remotes";

export default class AnchorBlockLogic extends BlockLogic {
	constructor(block: BlockModel) {
		super(block);

		Remotes.Client.GetNamespace("Blocks").GetNamespace("AnchorBlock").Get("Anchor").SendToServer(block);
	}
}
