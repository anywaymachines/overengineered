import { ReplicatedStorage } from "@rbxts/services";
import Objects from "./fixes/objects";

export type Category = {
	readonly name: CategoryName;
	readonly sub: Categories;
};
export type Categories = Readonly<Record<CategoryName, Category>>;

export const blockRegistry = new Map<string, Block>() as ReadonlyMap<string, Block>;
export const blockList: readonly Block[] = [];
export const categoriesRegistry: Categories = {};

export default class Registry {
	static findCategoryPath(categories: Categories, key: string): CategoryName[] | undefined {
		for (const [category, _] of Objects.pairs(categories)) {
			if (category === key) {
				return [category];
			}
			const subPath = this.findCategoryPath(categories[category].sub, key);
			if (subPath) {
				return [category, ...subPath];
			}
		}
	}
}

function readCategory(folder: Folder, prev: Categories) {
	const name = folder.Name as CategoryName;
	(prev as Writable<typeof prev>)[name] = {
		name: name,
		sub: {},
	};

	for (const child of folder.GetChildren()) {
		if (child.IsA("Folder")) {
			readCategory(child, prev[name].sub);
		} else if (child.IsA("Model")) {
			readBlock(child as BlockModel, name);
		}
	}
}

function readBlock(categoryBlock: BlockModel, categoryName: string) {
	const id = categoryBlock.Name.lower();
	const name = (categoryBlock.GetAttribute("name") as string | undefined) ?? categoryBlock.Name;
	const info = (categoryBlock.GetAttribute("info") as string | undefined) ?? "No description";
	const required = (categoryBlock.GetAttribute("required") as boolean | undefined) ?? false;
	const limit = (categoryBlock.GetAttribute("limit") as number | undefined) ?? 2000;

	const block: Block = {
		id,
		displayName: name,
		info: info,
		model: categoryBlock as BlockModel,
		category: categoryName,
		required,
		limit,
	};
	(blockRegistry as Map<string, Block>).set(id, block);
	(blockList as Block[]).push(block);
}

const placeable = ReplicatedStorage.WaitForChild("Assets")
	.WaitForChild("Placeable")
	.GetChildren()
	.sort((a, b) => a.Name < b.Name) as unknown as readonly Folder[];

for (const child of placeable) {
	readCategory(child, categoriesRegistry);
}

(blockList as Block[]).sort((left, right) => left.id < right.id);
