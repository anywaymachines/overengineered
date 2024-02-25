import { ReplicatedStorage } from "@rbxts/services";
import { BlockDataRegistry } from "./BlockDataRegistry";
import { AutoBlockCreator } from "./block/logic/AutoBlockCreator";
import Arrays from "./fixes/Arrays";
import Objects from "./fixes/objects";

declare global {
	type RegistryBlock = {
		readonly id: string;
		readonly displayName: string;
		readonly info: string;
		readonly model: BlockModel;
		readonly category: CategoryName;
		readonly required?: boolean;
		readonly limit?: number;
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

	const readBlockModelAttributes = (block: Model) => {
		return {
			id: block.GetAttribute("id") as string | undefined,
			name: block.GetAttribute("name") as string | undefined,
			info: block.GetAttribute("info") as string | undefined,
			required: block.GetAttribute("required") as boolean | undefined,
			limit: block.GetAttribute("limit") as number | undefined,
		};
	};
	const removeBlockAttributes = (block: Model) => {
		for (const [key] of block.GetAttributes()) {
			block.SetAttribute(key, undefined);
		}
	};

	const readBlock = (block: Model, categoryName: string) => {
		if (!block.PrimaryPart) {
			throw `PrimaryPart in Block '${block.Name}' is not set!`;
		}

		{
			let anyAnchored = false;
			for (const part of block.GetDescendants()) {
				if (part.IsA("BasePart") && part.Anchored) {
					anyAnchored = true;
					break;
				}
			}

			if (!anyAnchored) {
				throw `No parts in block '${block.Name}' are anchored!`;
			}
		}

		const id = block.Name.lower();

		{
			const desc = BlockDataRegistry[id];
			if (desc) {
				let description = desc.description;
				if (![".", "!", "?", " "].includes(desc.description.sub(desc.description.size()))) {
					description += ".";
				}

				block.SetAttribute("info", description);
				block.SetAttribute("name", desc.name);
			}
		}

		const attributes = readBlockModelAttributes(block);
		removeBlockAttributes(block);

		// next checks are `!` instead of `!== undefined` to also throw in case of empty strings

		// eslint-disable-next-line roblox-ts/lua-truthiness
		if (!attributes.name) {
			throw `Attribute 'name' is not set for '${block.Name}'!`;
		}
		// eslint-disable-next-line roblox-ts/lua-truthiness
		if (!attributes.info) {
			throw `Attribute 'description' is not set for '${block.Name}'!`;
		}

		const regblock: RegistryBlock = {
			id,
			displayName: attributes.name ?? block.Name,
			info: attributes.info ?? "No description",
			model: block as BlockModel,
			category: categoryName as CategoryName,
			required: attributes.required,
			limit: attributes.limit,
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

const categories: Readonly<Record<CategoryName, Category>> = initData.categories;

const map: ReadonlyMap<string, RegistryBlock> = initData.blocks;
const sorted: readonly RegistryBlock[] = Arrays.map(initData.blocks, (_, v) => v).sort(
	(left, right) => left.id < right.id,
);
const required: readonly RegistryBlock[] = sorted.filter((b) => b.required);

export const BlocksInitializer = {
	blocks: {
		/** The map of blocks */
		map,
		/** All blocks, sorted by id */
		sorted,
		/** Blocks that have `required` set to `true` */
		required,
	},

	categories: {
		/** The map of block categories */
		categories,

		/** Get the full path of the category
		 * @example getCategoryPath(categories, 'Math') => ['Logic', 'Math']
		 */
		getCategoryPath(key: string, categories?: Categories): CategoryName[] | undefined {
			categories ??= BlocksInitializer.categories.categories;
			for (const [category, _] of Objects.pairs(categories)) {
				if (category === key) {
					return [category];
				}

				const subPath = this.getCategoryPath(key, categories[category].sub);
				if (subPath) {
					return [category, ...subPath];
				}
			}
		},
	},

	/** Empty method just to trigger the import */
	initialize() {},
} as const;

// don't delete, useful for something
// prints all blocks in .json format
// print(`{ ${blockList.map((b) => `"${b.id}":{"name":"${b.displayName.gsub('"', '\\"')[0]}", "description":"${b.info.gsub('"', '\\"')[0]}"}`).join(",")} }`);
