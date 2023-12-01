import { ReplicatedStorage } from "@rbxts/services";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";
import AbstractBlock from "../abstract/AbstractBlock";

export default class WedgeWing1x2 extends AbstractBlock {
	constructor() {
		super("wedgewing1x2");
	}

	public getDisplayName(): string {
		return "Wedge Wing 1x2";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("WedgeWing1x2") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.WINGS_CATEGORY;
	}
}
