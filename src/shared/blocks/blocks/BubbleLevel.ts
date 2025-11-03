import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		Front: {
			displayName: "Front",
			unit: "Number (0-1)",
			types: ["number"],
		},
		Back: {
			displayName: "Back",
			unit: "Number (0-1)",
			types: ["number"],
		},
		Left: {
			displayName: "Left",
			unit: "Number (0-1)",
			types: ["number"],
		},
		Right: {
			displayName: "Right",
			unit: "Number (0-1)",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as BubbleLevelBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const initialRotation = this.instance.GetPivot().Rotation;

		this.event.subscribe(RunService.PostSimulation, () => {
			const objSpace = initialRotation.ToObjectSpace(this.instance.GetPivot().Rotation);
			const [axis, angle] = objSpace.ToAxisAngle();
			this.output.Front.set("number", -math.clamp(axis.X, -1, 0));
			this.output.Back.set("number", math.clamp(axis.X, 0, 1));
			this.output.Left.set("number", math.clamp(axis.Z, 0, 1));
			this.output.Right.set("number", -math.clamp(axis.Z, -1, 0));
		});
	}
}

export const BubbleLevelBlock = {
	...BlockCreation.defaults,
	id: "bubblelevel",
	displayName: "Bubble level",
	description: "Beginner friendly stuff that helps balance rocket!",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
