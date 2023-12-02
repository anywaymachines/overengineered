import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class MotorBlock extends AbstractBlock implements ConfigurableBlock {
	constructor() {
		super("servomotorblock");
	}

	public getDisplayName(): string {
		return "Servomotor Block";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("ServoMotorBlock") as Model;
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.ENGINES_CATEGORY;
	}

	getConfigDefinitions() {
		return {
			rotate_add: {
				id: "rotate_add",
				displayName: "Rotate +",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.Q,
					Gamepad: Enum.KeyCode.ButtonR2,
				},
			},
			rotate_sub: {
				id: "rotate_sub",
				displayName: "Rotate -",
				type: "Key",
				default: {
					Desktop: Enum.KeyCode.E,
					Gamepad: Enum.KeyCode.ButtonL2,
				},
			},
			speed: {
				id: "speed",
				displayName: "Max. speed",
				type: "Number",
				min: 0,
				max: 50,
				step: 1,
				default: {
					Desktop: 15,
				},
			},
			angle: {
				id: "angle",
				displayName: "Angle",
				type: "Number",
				min: -180,
				max: 180,
				step: 1,
				default: {
					Desktop: 45,
				},
			},
			switch: {
				id: "switch",
				displayName: "Switch",
				type: "Bool",
				default: {
					Desktop: false,
				},
			},
		} satisfies Record<string, ConfigDefinition>;
	}
}
