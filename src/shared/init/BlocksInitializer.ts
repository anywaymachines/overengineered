import { BlockRegistry } from "shared/block/BlockRegistry";
import { AutoOperationsCreator } from "shared/block/creation/AutoOperationsCreator";
import { BlockCreatorFromAssets } from "shared/block/creation/BlockCreatorFromAssets";
import { GeneratedBlocksCreator } from "shared/block/creation/GeneratedBlockCreator";
import { SharedGameLoader } from "shared/init/SharedGameLoader";

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
	export const initialize = SharedGameLoader.lazyLoader("Initializing blocks", init);
	function init() {
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

		BlockRegistry.editable().add(initData.blocks.values(), initData.categories);
	}
}
