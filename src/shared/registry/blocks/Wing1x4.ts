import { ReplicatedStorage } from "@rbxts/services";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";
import AbstractBlock from "../abstract/AbstractBlock";

export default class Wing1x4 extends AbstractBlock {
	constructor() {
		super("wing1x4");
	}

	public getDisplayName(): string {
		return "Wing 1x4";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("Wing1x4") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.WINGS_CATEGORY;
	}
}
