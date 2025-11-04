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
		const upCfInit = CFrame.fromAxisAngle(this.instance.GetPivot().UpVector, 0);

		this.event.subscribe(RunService.PostSimulation, () => {
			const upCf = CFrame.fromAxisAngle(this.instance.GetPivot().UpVector, 0);
			const objSpace = upCfInit.ToObjectSpace(upCf);
			print(objSpace);
			this.output.Front.set("number", -math.clamp(objSpace.UpVector.X, -1, 0));
			this.output.Back.set("number", math.clamp(objSpace.UpVector.X, 0, 1));
			this.output.Left.set("number", math.clamp(objSpace.UpVector.Z, 0, 1));
			this.output.Right.set("number", -math.clamp(objSpace.UpVector.Z, -1, 0));
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
