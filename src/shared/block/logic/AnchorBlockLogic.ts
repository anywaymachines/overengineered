import Remotes from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";
import BlockLogic from "../BlockLogic";

export default class AnchorBlockLogic extends BlockLogic {
	constructor(block: PlacedBlockData) {
		super(block);

		Remotes.Client.GetNamespace("Blocks").GetNamespace("AnchorBlock").Get("Anchor").SendToServer(block.instance);
	}
}
