import { ReplicatedStorage } from "@rbxts/services";
import Block from "shared/registry/Block";

export default class TestBlock extends Block {
	constructor() {
		super("testblock");
	}

	public getDisplayName(): string {
		return "TestBlock";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("TestBlock") as Model;
	}

	public getAssetID(): number {
		return 0; // TODO
	}
}
