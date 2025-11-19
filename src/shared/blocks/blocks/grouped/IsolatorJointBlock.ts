import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["restitution", "free_length"],
	input: {
		restitution: {
			displayName: "Restitution",
			tooltip: "It's gonna bounce back!",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 1,
						step: 0.05,
					},
				},
			},
			connectorHidden: true,
		},
		free_length: {
			displayName: "Free Length",
			unit: "WILL BE LIMITED TO 50% THE SIZE",
			tooltip: "So I decided to nerf it to 50% the minimal size!",
			types: {
				number: {
					config: 2,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 1,
						step: 0.01,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type SuspensionModel = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly SpringConstraint: SpringConstraint;
		readonly RopeConstraint: RopeConstraint;
	};
};

export type { Logic as SuspensionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, SuspensionModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const springSide = this.instance.SpringSide;
		if (!springSide) return;
		const spring = springSide.SpringConstraint;
		const rope = springSide.RopeConstraint;

		const blockScale = BlockManager.manager.scale.get(block.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;
		const xzScale = math.min(blockScale.X, blockScale.Z);

		spring.Radius *= blockScale.findMin();
		spring.Thickness *= blockScale.findMin();

		const setSpringParameters = ({ restitution, free_length }: { restitution: number; free_length: number }) => {
			if (!spring) return;
			rope.Restitution = restitution;
			rope.Length = math.clamp(free_length, 0, xzScale);
		};

		this.onkFirstInputs(["restitution", "free_length"], setSpringParameters);
		this.on(setSpringParameters);
	}
}

export const IsolatorBlock = {
	...BlockCreation.defaults,
	id: "isolatorjointblock",
	displayName: "Isolator joint",
	description: "THERE IS AN EARTHQUAKE GOING ON HELP!!! jk. We have the isolator",

	search: {
		aliases: ["earthquake"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
