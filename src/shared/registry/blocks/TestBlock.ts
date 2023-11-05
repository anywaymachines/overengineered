import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class TestBlock extends AbstractBlock {
	constructor() {
		super("testblock");
	}

	public getDisplayName(): string {
		return "TestBlock";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("TestBlock") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.BLOCKS_CATEGORY;
	}
}
