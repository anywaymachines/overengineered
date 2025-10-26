import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder, BlockModelSource } from "shared/blocks/Block";

const definition = {
	input: {
		input: {
			displayName: "Input",
			tooltip: "Wire source impulse here",
			types: {
				bool: {
					config: false,
				},
			},
		},
		length: {
			displayName: "New impulse length",
			tooltip: "Length of the new impulse",
			types: {
				number: {
					config: 2,
				},
			},
		},
		tickBased: {
			displayName: "Delaying in ticks",
			tooltip: "Controls whether the duration is measued in ticks (true) or seconds (false)",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Extended impulse",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as ImpulseExtenderBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let lenLeft = 0;
		let goalTime = DateTime.now().UnixTimestampMillis / 1000;
		const len = this.initializeInputCache("length");
		const state = this.initializeInputCache("input");
		const tickBased = this.initializeInputCache("tickBased");

		this.onTicc(() => {
			if (state.tryGet()) {
				lenLeft = math.max(1, len.tryGet() ?? 0);
				if (!tickBased.get()) {
					goalTime = DateTime.now().UnixTimestampMillis / 1000 + len.get();
				}
			}
			const aboveTime = goalTime - DateTime.now().UnixTimestampMillis / 1000 > 0;
			this.output.result.set("bool", --lenLeft > 0 || aboveTime);
		});
	}
}

export const ImpulseExtenderBlock = {
	...BlockCreation.defaults,
	id: "impulseextender",
	displayName: "Impulse Extender",
	description: "Extends pulse to specified amount of ticks or seconds.",

	modelSource: {
		model: BlockCreation.Model.fAutoCreated("GenericLogicBlockPrefab", "ImpExt"),
		category: () => BlockCreation.Categories.other,
	} satisfies BlockModelSource,
	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
