import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		result: {
			displayName: "Broken",
			unit: "bool",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as BreakSensorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
		this.onEnable(() => this.output.result.set("bool", false));
		this.onDisable(() => this.output.result.set("bool", true));
	}
}

export const BreakSensorBlock = {
	...BlockCreation.defaults,
	id: "breaksensor",
	displayName: "Break Sensor",
	description: "Returns true when it becomes disabled",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "BREAK"),
		category: () => BlockCreation.Categories.sensor,
	},
} as const satisfies BlockBuilder;
