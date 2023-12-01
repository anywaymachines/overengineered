import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class SmallRocketEngineBlock extends AbstractBlock implements ConfigurableBlock {
	constructor() {
		super("smallrocketengine");
	}

	public getDisplayName(): string {
		return "Small Rocket Engine";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("SmallRocketEngine") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.ENGINES_CATEGORY;
	}

	getConfigDefinitions() {
		return {
			thrust_add: {
				id: "thrust_add",
				displayName: "Thrust +",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.W,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
			thrust_sub: {
				id: "thrust_sub",
				displayName: "Thrust -",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.S,
					Gamepad: Enum.KeyCode.ButtonL2,
				},
			},
			switchmode: {
				id: "switchmode",
				displayName: "Switch Mode",
				type: "Bool",
				default: {
					Desktop: false,
					Gamepad: false,
				},
			},
		} satisfies Record<string, ConfigDefinition>;
	}
}
