import { ReplicatedStorage } from "@rbxts/services";
import { BlockDataRegistry } from "./BlockDataRegistry";
import { AutoBlockCreator } from "./block/logic/AutoBlockCreator";
import { Objects } from "./fixes/objects";

declare global {
	type RegistryBlock = {
		readonly id: string;
		readonly displayName: string;
		readonly info: string;
		readonly model: BlockModel;
		readonly category: CategoryName;
		readonly required: boolean | undefined;
		readonly limit: number | undefined;
		readonly autoWeldShape: AutoWeldColliderBlockShape | undefined;
		readonly mirrorBehaviour: BlockMirrorBehaviour | undefined;
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

namespace Checks {
	type AssertedModel = Model & { PrimaryPart: BasePart };

	function assertPrimaryPartSet(block: Model): asserts block is AssertedModel {
		if (!block.PrimaryPart) {
			throw `PrimaryPart in Block '${block.Name}' is not set!`;
		}
	}
	function assertColboxIsPrimaryPartIfExists(block: AssertedModel) {
		for (const child of block.GetDescendants()) {
			if (child.Name.lower() === "colbox") {
				if (block.PrimaryPart !== child) {
					throw `Colbox in Block '${block.Name}' is not a primary part!`;
				}
			}
		}
	}
	function assertColboxWeldedIfExists(block: AssertedModel) {
		if (block.PrimaryPart.Name.lower() !== "colbox") return;

		for (const weld of block.GetDescendants()) {
			if (!weld.IsA("WeldConstraint")) continue;

			if (weld.Part0 === block.PrimaryPart && weld.Part1 && weld.Part1 !== block.PrimaryPart) {
				return;
			}
			if (weld.Part1 === block.PrimaryPart && weld.Part0 && weld.Part0 !== block.PrimaryPart) {
				return;
			}
		}

		throw `Colbox in Block '${block.Name}' is not welded to anything!`;
	}
	function assertValidVelds(block: AssertedModel) {
		for (const weld of block.GetDescendants()) {
			if (!weld.IsA("WeldConstraint")) continue;

			if (!weld.Part0 || !weld.Part1) {
				throw `Partial weld found in block ${block.Name} in weld parent ${weld.Parent}`;
			}
			if (!weld.Part0.IsDescendantOf(block) || !weld.Part1.IsDescendantOf(block)) {
				throw `Outer weld reference found in block ${block.Name} in weld parent ${weld.Parent}`;
			}
		}
	}
	function assertSomethingAnchored(block: AssertedModel) {
		for (const part of block.GetDescendants()) {
			if (part.IsA("BasePart") && part.Anchored) {
				return;
			}
		}

		throw `No parts in block '${block.Name}' are anchored!`;
	}
	function assertHasDataInRegistry(block: Model) {
		if (!BlockDataRegistry[block.Name.lower()]) {
			throw `No registry data found for block ${block.Name}`;
		}
	}

	export function checkAll(block: Model) {
		assertPrimaryPartSet(block);
		assertColboxIsPrimaryPartIfExists(block);
		assertColboxWeldedIfExists(block);
		assertValidVelds(block);
		assertSomethingAnchored(block);
		assertHasDataInRegistry(block);
	}
}

/** Read blocks and categories from {@link ReplicatedStorage.Assets.Placeable} */
const readFromAssets = (data: BlocksInitializeData) => {
	const readCategory = (folder: Folder, prev: Writable<Categories>) => {
		const name = folder.Name as CategoryName;
		prev[name] = { name: name, sub: {} };

		for (const child of folder.GetChildren()) {
			if (child.IsA("Folder")) {
				readCategory(child, prev[name].sub);
			} else if (child.IsA("Model")) {
				readBlock(child as BlockModel, name);
			}
		}
	};

	const readBlock = (block: Model, categoryName: string) => {
		Checks.checkAll(block);

		const id = block.Name.lower();

		const attributes = BlockDataRegistry[id];
		const regblock: RegistryBlock = {
			id,
			displayName: attributes.name,
			info: attributes.description,
			required: attributes.required,
			limit: attributes.limit,
			autoWeldShape: attributes.autoWeldShape,
			mirrorBehaviour: attributes.mirrorBehaviour,
			model: block as BlockModel,
			category: categoryName as CategoryName,
		};
		data.blocks.set(regblock.id, regblock);
	};

	const placeable = ReplicatedStorage.WaitForChild("Assets")
		.WaitForChild("Placeable")
		.GetChildren() as unknown as readonly Folder[];

	for (const child of placeable) {
		readCategory(child, data.categories);
	}
};

//

const init = (): BlocksInitializeData => {
	const initData: BlocksInitializeData = {
		blocks: new Map<string, RegistryBlock>(),
		categories: {},
	};

	readFromAssets(initData);
	AutoBlockCreator.create(initData);
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
			for (const [category, _] of Objects.pairs_(categories)) {
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
