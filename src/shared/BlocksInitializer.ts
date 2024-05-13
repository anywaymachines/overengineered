import { BlockCreatorFromAssets } from "shared/block/creation/BlockCreatorFromAssets";
import { GeneratedBlocksCreator } from "shared/block/creation/GeneratedBlockCreator";
import { AutoWeldColliderBlockShape, BlockId, BlockMirrorBehaviour } from "./BlockDataRegistry";
import { AutoOperationsCreator } from "./block/creation/AutoOperationsCreator";

declare global {
	type RegistryBlock = {
		readonly id: BlockId;
		readonly displayName: string;
		readonly info: string;
		readonly model: BlockModel;
		readonly category: CategoryName;
		readonly required: boolean | undefined;
		readonly limit: number | undefined;
		readonly autoWeldShape: AutoWeldColliderBlockShape | undefined;
		readonly mirrorBehaviour: BlockMirrorBehaviour | undefined;
		readonly mirrorReplacementId: BlockId | undefined;
	};

	type CategoryName = string & { readonly ___nominal: "CategoryName" };
}

type Category = {
	readonly name: CategoryName;
	readonly sub: Categories;
};
type Categories = Readonly<Record<CategoryName, Category>>;

export type BlocksInitializeData = {
	readonly blocks: Map<string, RegistryBlock>;
	readonly categories: Writable<Categories>;
};

//

const init = (): BlocksInitializeData => {
	const initData: BlocksInitializeData = {
		blocks: new Map<string, RegistryBlock>(),
		categories: {},
	};

	const initializers = [
		BlockCreatorFromAssets.readFromAssets,
		AutoOperationsCreator.create,
		GeneratedBlocksCreator.create,
	];
	for (const initializer of initializers) {
		initializer(initData);
	}

	return initData;
};

const initData = init();

export namespace BlocksInitializer {
	export namespace blocks {
		/** The map of blocks */
		export const map: ReadonlyMap<string, RegistryBlock> = initData.blocks;
		/** All blocks, sorted by id */
		export const sorted: readonly RegistryBlock[] = initData.blocks
			.map((_, v) => v)
			.sort((left, right) => left.id < right.id);
		/** Blocks that have `required` set to `true` */
		export const required: readonly RegistryBlock[] = sorted.filter((b) => b.required);
	}

	export namespace categories {
		/** The map of block categories */
		export const categories: Readonly<Record<CategoryName, Category>> = initData.categories;

		/** Get the full path of the category
		 * @example getCategoryPath(categories, 'Math') => ['Logic', 'Math']
		 */
		export function getCategoryPath(key: string, categories?: Categories): CategoryName[] | undefined {
			categories ??= BlocksInitializer.categories.categories;
			for (const [category] of pairs(categories)) {
				if (category === key) {
					return [category];
				}

				const subPath = getCategoryPath(key, categories[category].sub);
				if (subPath) {
					return [category, ...subPath];
				}
			}
		}
	}

	/** Empty method just to trigger the import */
	export function initialize() {}
}

// don't delete, useful for something
// prints all blocks in .json format
// print(`{ ${blockList.map((b) => `"${b.id}":{"name":"${b.displayName.gsub('"', '\\"')[0]}", "description":"${b.info.gsub('"', '\\"')[0]}"}`).join(",")} }`);
