import { BlockId } from "shared/BlockDataRegistry";
import { BlocksInitializeData } from "shared/BlocksInitializer";
import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { BlockGenerator } from "shared/block/creation/BlockGenerator";

interface CreateInfo {
	readonly modelTextOverride: string;
	readonly category: readonly string[];
	readonly prefab: BlockGenerator.PrefabName;
	// readonly logic?: LogicCtor;
	// readonly config?: BlockConfigTypes.BothDefinitions;
	readonly required?: boolean;
	readonly limit?: number;
}

const prefabs = BlockGenerator.prefabNames;
const categories = {
	other: ["Logic", "Other"],
} as const satisfies { [k in string]: readonly string[] };

const blocks = {
	counter: {
		modelTextOverride: "COUNTER",
		category: categories.other,
		prefab: prefabs.tripleGeneric,
	},
	delayblock: {
		modelTextOverride: "DELAY",
		category: categories.other,
		prefab: prefabs.doubleGeneric,
	},
	logicmemory: {
		modelTextOverride: "MEMORY",
		category: categories.other,
		prefab: prefabs.doubleGeneric,
	},
} as const satisfies Record<string, CreateInfo>;

export namespace GeneratedBlocksCreator {
	export function create(info: BlocksInitializeData) {
		for (const [id, data] of pairs(blocks as { [k in keyof typeof blocks]: CreateInfo })) {
			const logic = /*data.logic ??*/ BlockLogicRegistry.registry[id];
			if (!logic) throw `No logic found for auto-created block ${id}`;

			const config = /*data.config ??*/ blockConfigRegistry[id];
			if (!config) throw `No config found for auto-created block ${id}`;

			BlockGenerator.create(info, { id: id.lower() as BlockId, ...data, logic, config });
		}
	}
}
