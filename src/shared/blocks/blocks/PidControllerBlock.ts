import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["target", "p", "i", "d", "now", "iMin", "iMax"],
	input: {
		target: {
			displayName: "Target value",
			types: {
				number: {
					config: 0,
				},
			},
		},
		p: {
			displayName: "P",
			types: {
				number: {
					config: 0,
				},
			},
		},
		i: {
			displayName: "I",
			types: {
				number: {
					config: 0,
				},
			},
		},
		d: {
			displayName: "D",
			types: {
				number: {
					config: 0,
				},
			},
		},
		now: {
			displayName: "Current value",
			types: {
				number: {
					config: 0,
				},
			},
		},
		iMin: {
			displayName: "Min integeral border",
			types: {
				number: {
					config: 0,
				},
			},
			connectorHidden: true,
		},
		iMax: {
			displayName: "Max integeral border",
			types: {
				number: {
					config: 0,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		output: {
			displayName: "Output",
			types: ["number"],
		},
		integral: {
			displayName: "integral",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PidControllerBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		let inputValues = {
			p: 0,
			i: 0,
			d: 0,
			target: 0,
			now: 0,
			iMin: 0,
			iMax: 0,
		};

		this.on((data) => (inputValues = data));

		let errorPrev = 0;
		let integral = 0;
		this.onTicc(({ dt }) => {
			const errorCost = inputValues.target - inputValues.now;
			// limitation of the integral, since the error during the delay will accumulate infinitely
			integral = math.clamp(integral + errorCost * dt, inputValues.iMin, inputValues.iMax);
			const derivative = (errorCost - errorPrev) / dt;
			const output = inputValues.p * errorCost + inputValues.i * integral + inputValues.d * derivative;

			errorPrev = errorCost;

			this.output.integral.set("number", integral);
			this.output.output.set("number", output);
		});
	}
}

export const PidControllerBlock = {
	...BlockCreation.defaults,
	id: "pidcontrollerblock",
	displayName: "Pid Controller",
	description: "Controller: P/I/D - proportional+integral+differential",
	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "PID"),
		category: () => BlockCreation.Categories.other,
	},
} as const satisfies BlockBuilder;
