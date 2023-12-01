import { ReplicatedStorage } from "@rbxts/services";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";
import AbstractBlock from "../abstract/AbstractBlock";

export default class WedgeWing1x3 extends AbstractBlock {
	constructor() {
		super("wedgewing1x3");
	}

	public getDisplayName(): string {
		return "Wedge Wing 1x3";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("WedgeWing1x3") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.WINGS_CATEGORY;
	}
}
