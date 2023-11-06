import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class Block extends AbstractBlock {
	constructor() {
		super("block");
	}

	public getDisplayName(): string {
		return "Block";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("Block") as Model;
	}

	public getAvailableRotationAxis(): { x: boolean; y: boolean; z: boolean } {
		return { x: false, y: false, z: false };
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.BLOCKS_CATEGORY;
	}
}
