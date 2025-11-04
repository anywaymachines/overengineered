import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const clampEm = (num: number): number => math.clamp(num, 0, 1);

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
		const upCfInit = this.instance.GetPivot().UpVector;

		this.event.subscribe(RunService.PostSimulation, () => {
			const pivot = this.instance.GetPivot();
			const Up = pivot.UpVector;
			const Down = pivot.UpVector.mul(-1);
			const Left = pivot.RightVector.mul(-1);
			const Right = pivot.RightVector;
			// Now use dot to calculate this stuff i think so (my sanity is spinning around)
			const DotDown = Down.Dot(upCfInit);
			const DotUp = Up.Dot(upCfInit);
			const DotLeft = Left.Dot(upCfInit);
			const DotRight = Right.Dot(upCfInit);

			const downClamp = clampEm(DotDown);
			const upClamp = clampEm(DotUp);
			const leftClamp = clampEm(DotLeft);
			const rightClamp = clampEm(DotRight);

			this.output.Front.set("number", upClamp);
			this.output.Back.set("number", downClamp);
			this.output.Left.set("number", leftClamp);
			this.output.Right.set("number", rightClamp);
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
