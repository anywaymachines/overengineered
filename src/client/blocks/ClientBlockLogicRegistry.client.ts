import { KnownBlockLogic } from "shared/block/BlockLogicRegistry";
import { ClientBlockLogic } from "./ClientBlockLogic";

type ShareableLogic = ExtractMembers<KnownBlockLogic, { readonly clientEvents: Record<string, unknown> }>;
type ClientBlockLogicRegistry = {
	readonly [k in keyof ShareableLogic]: new (logic: ShareableLogic[k]) => ClientBlockLogic<ShareableLogic[k]>;
};

const clientBlockLogicRegistry: ClientBlockLogicRegistry = {};

//
const logics: object[] = [];
for (const [id, logic] of pairs(clientBlockLogicRegistry)) {
	$log(`Initializing client logic for ${id}`);
	//logics.push(new logic(BlockLogicRegistry.registry[id] as never));
}
