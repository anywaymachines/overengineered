import { RunService } from "@rbxts/services";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { AutoOperationsCreator } from "shared/block/creation/AutoOperationsCreator";
import { BlockCreatorFromAssets } from "shared/block/creation/BlockCreatorFromAssets";
import { BlockGenerator } from "shared/block/creation/BlockGenerator";
import { GeneratedBlocksCreator } from "shared/block/creation/GeneratedBlockCreator";

declare global {
	type CategoryName = string & { readonly ___nominal: "CategoryName" };
	type CategoryPath = readonly CategoryName[];
}

export type Category = {
	readonly path: CategoryPath;
	readonly name: CategoryName;
	readonly sub: Categories;
};
export type Categories = Readonly<Record<CategoryName, Category>>;

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

		if (RunService.IsStudio() && RunService.IsServer()) {
			const errors: { readonly id: string; readonly errors: readonly string[] }[] = [];
			for (const [id, block] of initData.blocks) {
				const blockErrors = BlockGenerator.Assertions.getAllErrors(block.model);
				if (blockErrors.size() !== 0) {
					errors.push({ id, errors: [...new Set(blockErrors)] });
				}
			}
			if (errors.size() !== 0) {
				throw `Found block errors:\n${errors.map(({ id, errors }) => `${id}:\n${errors.map((e) => `    ${e}`).join("\n")}`).join("\n\n")}`;
			}
		}

		return new BlockRegistry(initData.blocks.values(), initData.categories);
	}
}
