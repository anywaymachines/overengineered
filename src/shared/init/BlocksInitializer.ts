import { BlockRegistry, BlockRegistryC } from "shared/block/BlockRegistry";
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
	let registry: BlockRegistryC | undefined;

	export function create(): BlockRegistryC {
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

		return (registry = new BlockRegistryC(initData.blocks.values(), initData.categories));
	}

	export function initialize() {
		if (!registry) create();
		assert(registry);

		BlockRegistry.editable().add(registry.blocks.values(), registry.categories);
	}
}
