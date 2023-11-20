import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class DisconnectBlock extends AbstractBlock implements ConfigurableBlock {
	constructor() {
		super("disconnectblock");
	}

	public getDisplayName(): string {
		return "Disconnect Block";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("DisconnectBlock") as Model;
	}

	public getAvailableRotationAxis(): { x: boolean; y: boolean; z: boolean } {
		return { x: true, y: true, z: true };
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.BLOCKS_CATEGORY;
	}

	getConfigDefinitions(): ConfigDefinition[] {
		return [
			{
				id: "disconnect",
				displayName: "Disconnect key",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.F.Value,
					Gamepad: Enum.KeyCode.ButtonR2.Value,
				},
			},
			{
				id: "test1",
				displayName: "Test 1",
				type: "Number",
				default: {
					Desktop: 1,
					Gamepad: 1,
				},
				min: 0,
				max: 10,
				step: 1,
			},
			{
				id: "test2",
				displayName: "Test 2",
				type: "Bool",
				default: {
					Desktop: true,
					Gamepad: true,
				},
			},
		];
	}
}
