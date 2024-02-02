import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import BlockLogic from "../BlockLogic";

export default class AnchorBlockLogic extends BlockLogic {
	static readonly events = {
		anchor: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("anchorblock_anchor"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block);
		AnchorBlockLogic.events.anchor.send({ block: block.instance });
	}
}
