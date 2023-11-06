import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class BlockCornerWedge4x1 extends AbstractBlock {
	constructor() {
		super("cornerwedge4x1");
	}

	public getDisplayName(): string {
		return "CornerWedge 4x1";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("CornerWedge4x1") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.BLOCKS_CATEGORY;
	}
}
