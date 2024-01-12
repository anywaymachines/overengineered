import { ReplicatedStorage } from "@rbxts/services";

export type Categories = Readonly<Record<Category, { readonly name: string; readonly sub: Categories }>>;

export const blockRegistry = new Map<string, Block>() as ReadonlyMap<string, Block>;
export const blockList: readonly Block[] = [];
export const categoriesRegistry: Categories = {};

function readCategory(folder: Folder, prev: Categories) {
	const name = folder.Name;
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
	const required = (categoryBlock.GetAttribute("required") as boolean | undefined) ?? false;
	const limit = (categoryBlock.GetAttribute("limit") as number | undefined) ?? 2000;

	const block: Block = {
		id,
		displayName: name,
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
