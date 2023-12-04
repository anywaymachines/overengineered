import { ReplicatedStorage } from "@rbxts/services";
import Block from "./abstract/Block";

export type Category = string;

export default class BlockRegistry {
	public static readonly blocks = new Map<string, Block>() as ReadonlyMap<string, Block>;
	public static readonly blockList: readonly Block[] = [];
	public static readonly categories: readonly Category[] = [];

	static {
		for (const rbcategory of ReplicatedStorage.WaitForChild("Assets")
			.WaitForChild("Placeable")
			.GetChildren()
			.sort((a, b) => a.Name < b.Name)) {
			if (!rbcategory.IsA("Folder")) continue;

			const category = rbcategory.Name;
			(this.categories as Category[]).push(category);

			for (const rbblock of rbcategory.GetChildren().sort((a, b) => a.Name < b.Name)) {
				if (!rbblock.IsA("Model")) continue;

				const id = rbblock.Name.lower();
				const name = (rbblock.GetAttribute("name") as string | undefined) ?? rbblock.Name;
				const required = (rbblock.GetAttribute("required") as boolean | undefined) ?? false;
				const limit = (rbblock.GetAttribute("limit") as number | undefined) ?? 500;

				const block = new Block(id, name, rbblock, category, required, limit);
				(this.blocks as Map<string, Block>).set(id, block);
				(this.blockList as Block[]).push(block);

				print(block.id);
			}
		}
	}

	static get(id: string) {
		const block = this.blocks.get(id);
		if (!block) throw "Unknown block " + id;

		return block;
	}
}
