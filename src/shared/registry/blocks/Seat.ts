import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class SeatBlock extends AbstractBlock {
	constructor() {
		super("seat");
	}

	public getDisplayName(): string {
		return "Seat";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("Seat") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.SEATS_CATEGORY;
	}
}
