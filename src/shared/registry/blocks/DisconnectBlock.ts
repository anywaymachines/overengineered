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
				displayName: "Disconnect key",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.F,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
		];
	}
}
