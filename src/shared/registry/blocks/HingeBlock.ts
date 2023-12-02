import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class HingeBlock extends AbstractBlock {
	constructor() {
		super("hingeblock");
	}

	public getDisplayName(): string {
		return "Hinge Block";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("HingeBlock") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.ENGINES_CATEGORY;
	}
}
