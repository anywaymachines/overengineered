import { PistonBlockServerLogic } from "server/blocks/logic/PistonBlockServerLogic";
import { Logger } from "shared/Logger";
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
	disconnectblock: DisconnectBlockServerLogic,
	lamp: LampServerLogic,
	screen: ScreenServerLogic,
	piston: PistonBlockServerLogic,
};

//
const logics: object[] = [];
for (const [id, logic] of Objects.pairs_(serverBlockLogicRegistry)) {
	Logger.info(`Initializing server logic for ${id}`);
	logics.push(new logic(logicRegistry[id] as never));
}
