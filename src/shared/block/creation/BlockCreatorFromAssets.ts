import { ReplicatedStorage, RunService } from "@rbxts/services";
import { BlockId } from "shared/BlockDataRegistry";
import { BlockGenerator } from "shared/block/creation/BlockGenerator";
import { BlocksInitializeData } from "shared/init/BlocksInitializer";

/** Reads blocks and categories from {@link ReplicatedStorage.Assets.Placeable} */
export namespace BlockCreatorFromAssets {
	export function readFromAssets(data: BlocksInitializeData) {
		const placeable = ReplicatedStorage.WaitForChild("Assets")
			.WaitForChild("Placeable")
			.GetChildren() as unknown as readonly Folder[];

		for (const child of placeable) {
			readCategory(data, child, data.categories);
		}
	}

	function readCategory(data: BlocksInitializeData, folder: Folder, prev: BlocksInitializeData["categories"]) {
		const name = folder.Name as CategoryName;
		prev[name] = { name: name, sub: {} };

		for (const child of folder.GetChildren()) {
			if (child.IsA("Folder")) {
				readCategory(data, child, prev[name].sub);
			} else if (child.IsA("Model")) {
				readBlock(data, child as BlockModel, name);
			}
		}
	}
	function readBlock(data: BlocksInitializeData, block: Model, categoryName: string) {
		if (RunService.IsStudio() && RunService.IsServer()) {
			BlockGenerator.Assertions.checkAll(block);
		}

		const id = block.Name.lower() as BlockId;
		const regblock = BlockGenerator.construct(id, block as BlockModel, categoryName as CategoryName);
		data.blocks.set(regblock.id, regblock);
	}
}
