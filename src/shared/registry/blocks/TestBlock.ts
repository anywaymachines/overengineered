import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/AbstractBlock";

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
}
