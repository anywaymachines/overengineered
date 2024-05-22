import { DisconnectBlockServerLogic } from "server/blocks/logic/DisconnectBlockServerLogic";
import { LampServerLogic } from "server/blocks/logic/LampServerLogic";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { PistonBlockServerLogic } from "server/blocks/logic/PistonBlockServerLogic";
import { ScreenServerLogic } from "server/blocks/logic/ScreenServerLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { TNTServerBlockLogic } from "server/blocks/logic/TNTServerLogic";
import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import type { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { KnownBlockLogic } from "shared/block/BlockLogicRegistry";

type ShareableLogic = ExtractMembers<KnownBlockLogic, { readonly events: Record<string, unknown> }>;
type ServerBlockLogicRegistry = {
	readonly [k in keyof ShareableLogic]: new (logic: ShareableLogic[k]) => ServerBlockLogic<ShareableLogic[k]>;
};

const serverBlockLogicRegistry: ServerBlockLogicRegistry = {
	tnt: TNTServerBlockLogic,
	cylindricaltnt: TNTServerBlockLogic,
	sphericaltnt: TNTServerBlockLogic,
	disconnectblock: DisconnectBlockServerLogic,
	lamp: LampServerLogic,
	leddisplay: LEDDisplayServerLogic,
	screen: ScreenServerLogic,
	piston: PistonBlockServerLogic,
	sevensegmentdisplay: SevenSegmentDisplayServerLogic,
};

//
const logics: object[] = [];
for (const [id, logic] of pairs(serverBlockLogicRegistry)) {
	$log(`Initializing server logic for ${id}`);
	logics.push(new logic(BlockLogicRegistry.registry[id] as never));
}
