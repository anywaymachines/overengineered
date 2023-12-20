import { ReplicatedStorage } from "@rbxts/services";

export const blockRegistry = new Map<string, Block>() as ReadonlyMap<string, Block>;
export const blockList: readonly Block[] = [];
export const categoriesRegistry: readonly Category[] = [];

const placeable = ReplicatedStorage.WaitForChild("Assets")
	.WaitForChild("Placeable")
	.GetChildren()
	.sort((a, b) => a.Name < b.Name);

placeable
	.filter((category) => category.IsA("Folder"))
	.forEach((category) => {
		const categoryName = category.Name;
		(categoriesRegistry as Category[]).push(categoryName);

		category
			.GetChildren()
			.sort((a, b) => a.Name < b.Name)
			.filter((categoryBlock) => categoryBlock.IsA("Model"))
			.forEach((categoryBlock) => {
				const id = categoryBlock.Name.lower();
				const name = (categoryBlock.GetAttribute("name") as string | undefined) ?? categoryBlock.Name;
				const required = (categoryBlock.GetAttribute("required") as boolean | undefined) ?? false;
				const limit = (categoryBlock.GetAttribute("limit") as number | undefined) ?? 2000;

				const block: Block = {
					id,
					displayName: name,
					model: categoryBlock as Model,
					category: categoryName,
					required,
					limit,
				};
				(blockRegistry as Map<string, Block>).set(id, block);
				(blockList as Block[]).push(block);
			});
	});
