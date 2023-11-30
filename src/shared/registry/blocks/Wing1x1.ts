import { ReplicatedStorage } from "@rbxts/services";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";
import AbstractBlock from "../abstract/AbstractBlock";

export default class Wing1x1 extends AbstractBlock {
	constructor() {
		super("wing1x1");
	}

	public getDisplayName(): string {
		return "Wing 1x1";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("Wing1x1") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.WINGS_CATEGORY;
	}
}
