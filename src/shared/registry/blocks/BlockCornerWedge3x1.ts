import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class BlockCornerWedge3x1 extends AbstractBlock {
	constructor() {
		super("cornerwedge3x1");
	}

	public getDisplayName(): string {
		return "CornerWedge 3x1";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("CornerWedge3x1") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.BLOCKS_CATEGORY;
	}
}
