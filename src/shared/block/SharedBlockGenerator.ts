import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import type { BlockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export namespace SharedBlockGenerator {
	export function registerLogic(
		id: BlockId,
		logic: LogicCtor | undefined,
		def: BlockConfigTypes.BothDefinitions | undefined,
	) {
		if (logic) BlockLogicRegistry.asWritable()[id] = logic as never;
		if (def) (blockConfigRegistry as Writable<BlockConfigRegistry>)[id as keyof BlockConfigRegistry] = def;
	}
}
