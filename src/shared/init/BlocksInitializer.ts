import { BlockRegistry } from "shared/block/BlockRegistry";
import { AutoOperationsCreator } from "shared/block/creation/AutoOperationsCreator";
import { BlockCreatorFromAssets } from "shared/block/creation/BlockCreatorFromAssets";
import { GeneratedBlocksCreator } from "shared/block/creation/GeneratedBlockCreator";

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

export namespace BlocksInitializer {
	export function create(): BlockRegistry {
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

		return new BlockRegistry(initData.blocks.values(), initData.categories);
	}
}
