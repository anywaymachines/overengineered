import { ReplicatedStorage } from "@rbxts/services";

export const blockRegistry = new Map<string, Block>() as ReadonlyMap<string, Block>;
export const blockList: readonly Block[] = [];
export const categoriesRegistry: readonly Category[] = [];

const cats = ReplicatedStorage.WaitForChild("Assets")
	.WaitForChild("Placeable")
	.GetChildren()
	.sort((a, b) => a.Name < b.Name);

for (const rbcategory of cats) {
	if (!rbcategory.IsA("Folder")) continue;

	const category = rbcategory.Name;
	(categoriesRegistry as Category[]).push(category);

	for (const rbblock of rbcategory.GetChildren().sort((a, b) => a.Name < b.Name)) {
		if (!rbblock.IsA("Model")) continue;

		const id = rbblock.Name.lower();
		const name = (rbblock.GetAttribute("name") as string | undefined) ?? rbblock.Name;
		const required = (rbblock.GetAttribute("required") as boolean | undefined) ?? false;
		const limit = (rbblock.GetAttribute("limit") as number | undefined) ?? 500;

		const block: Block = { id, displayName: name, model: rbblock, category, required, limit };
		(blockRegistry as Map<string, Block>).set(id, block);
		(blockList as Block[]).push(block);
	}
}
