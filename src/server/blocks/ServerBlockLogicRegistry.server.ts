import { $log } from "rbxts-transformer-macros";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { PistonBlockServerLogic } from "server/blocks/logic/PistonBlockServerLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { logicRegistry } from "shared/block/LogicRegistry";
import { Objects } from "shared/fixes/objects";
import { ServerBlockLogic } from "./ServerBlockLogic";
import { DisconnectBlockServerLogic } from "./logic/DisconnectBlockServerLogic";
import { LampServerLogic } from "./logic/LampServerLogic";
import { ScreenServerLogic } from "./logic/ScreenServerLogic";
import { TNTServerBlockLogic } from "./logic/TNTServerLogic";

type ShareableLogic = ExtractMembers<typeof logicRegistry, { readonly events: Record<string, unknown> }>;
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
for (const [id, logic] of Objects.pairs_(serverBlockLogicRegistry)) {
	$log(`Initializing server logic for ${id}`);
	logics.push(new logic(logicRegistry[id] as never));
}
