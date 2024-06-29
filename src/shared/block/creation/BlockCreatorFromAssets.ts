import { ReplicatedStorage } from "@rbxts/services";
import { BlockGenerator } from "shared/block/creation/BlockGenerator";
import type { BlockId } from "shared/BlockDataRegistry";
import type { BlocksInitializeData } from "shared/init/BlocksInitializer";

/** Reads blocks and categories from {@link ReplicatedStorage.Assets.Placeable} */
export namespace BlockCreatorFromAssets {
	export function readFromAssets(data: BlocksInitializeData) {
		const placeable = ReplicatedStorage.WaitForChild("Assets")
			.WaitForChild("Placeable")
			.GetChildren() as unknown as readonly Folder[];

		for (const child of placeable) {
			readCategory(data, child, data.categories, []);
		}
	}

	function readCategory(
		data: BlocksInitializeData,
		folder: Folder,
		prev: BlocksInitializeData["categories"],
		path: CategoryPath,
	) {
		const name = folder.Name as CategoryName;
		path = [...path, name];
		prev[name] = { path, name: name, sub: {} };

		for (const child of folder.GetChildren()) {
			if (child.IsA("Folder")) {
				readCategory(data, child, prev[name].sub, path);
			} else if (child.IsA("Model")) {
				readBlock(data, child as BlockModel, path);
			}
		}
	}
	function readBlock(data: BlocksInitializeData, block: BlockModel, category: CategoryPath) {
		BlockGenerator.Assertions.checkAll(block);

		const id = block.Name.lower() as BlockId;
		const regblock = BlockGenerator.construct(id, block, category);
		data.blocks.set(regblock.id, regblock);
	}
}
