import BlockLogic from "client/base/BlockLogic";
import Remotes from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class AnchorBlockLogic extends BlockLogic {
	constructor(block: PlacedBlockData) {
		super(block);

		Remotes.Client.GetNamespace("Blocks").GetNamespace("AnchorBlock").Get("Anchor").SendToServer(block.instance);
	}
}
