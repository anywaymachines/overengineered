import { Logger } from "shared/Logger";
import { logicRegistry } from "shared/block/LogicRegistry";
import { Objects } from "shared/fixes/objects";
import { ClientBlockLogic } from "./ClientBlockLogic";

const logger = new Logger("ClientBlockLogicRegistry");

type ShareableLogic = ExtractMembers<typeof logicRegistry, { readonly clientEvents: Record<string, unknown> }>;
type ClientBlockLogicRegistry = {
	readonly [k in keyof ShareableLogic]: new (logic: ShareableLogic[k]) => ClientBlockLogic<ShareableLogic[k]>;
};

const clientBlockLogicRegistry: ClientBlockLogicRegistry = {};

//
const logics: object[] = [];
for (const [id, logic] of Objects.pairs_(clientBlockLogicRegistry)) {
	logger.info(`Initializing client logic for ${id}`);
	//logics.push(new logic(logicRegistry[id] as never));
}
