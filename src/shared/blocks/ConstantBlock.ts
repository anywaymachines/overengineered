import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockConfigBothDefinitions, PlacedBlockData2 } from "shared/blockLogic/BlockLogic";

// const config = {
// 	input: {
// 		value: BlockConfigDefinitions.any("Value", "number", "0"),
// 	},
// 	output: {
// 		result: BlockConfigDefinitions.any("Result", "number", "0"),
// 	},
// } satisfies BlockConfigBothDefinitions;
const config = {
	input: {
		value: {
			displayName: "Value",
			defaultType: "bool",
			group: "0",
			types: {
				bool: {
					config: false as boolean,
					default: false as boolean,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Value",
			defaultType: "bool",
			group: "0",
			types: {
				bool: {
					config: false as boolean,
					default: false as boolean,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;

export type { ConstantBlockLogic };
class ConstantBlockLogic extends BlockLogic<typeof config> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("disconnectblock_disconnect"),
	} as const;

	constructor(block: PlacedBlockData2) {
		super(block, config);
		this.event.subscribeObservable(
			this.input.value,
			({ value, valueType }) => this.output.result.set(valueType, value),
			true,
		);
	}
}

export const ConstantBlock = {
	id: "constant",
	name: "Constant",
	description: "Returns the value you've set",

	logic: { config, ctor: ConstantBlockLogic },
} as const satisfies Block;
