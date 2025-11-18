import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		strength: {
			displayName: "Strength",
			unit: "Percentage",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						max: 100,
						min: 0,
					},
				},
			},
			connectorHidden: true,
		},

		fuel: {
			displayName: "Fuel length",
			unit: "Seconds",
			types: {
				number: {
					config: 15,
					clamp: {
						showAsSlider: true,
						max: 15,
						min: 0.25,
					},
				},
			},
			connectorHidden: true,
		},

		ignite: {
			displayName: "Ignite",
			unit: "Boolean",
			tooltip: "WEEEEEEEEE!!!!!!!",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "B",
							switch: false,
							reversed: false,
						},
						canBeSwitch: false,
						canBeReversed: false,
					},
				},
			},
			connectorHidden: false,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type PropellantModel = BlockModel & {
	readonly Base: BasePart & {
		readonly Attachment: Attachment & {
			readonly VectorForce: VectorForce;
		};
	};
	readonly Fuel: BasePart;
	readonly EffectEmitter: BasePart & {
		readonly Fire: ParticleEmitter;
	};
	readonly ColBox: BasePart;
};

export type { Logic as solidPropellantLogic };
class Logic extends InstanceBlockLogic<typeof definition, PropellantModel> {
	private readonly vectorForce;
	private readonly particleEmitter;
	// these calmed em down and stop red lines at least
	private power: number | undefined;
	private fuel: number | undefined;
	private disabled = false;
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
		const colbox = this.instance.ColBox;
		this.vectorForce = this.instance.Base.Attachment.VectorForce;
		this.particleEmitter = this.instance.EffectEmitter.Fire;
		this.onk(["ignite"], ({ ignite }) => {
			if (ignite && !this.disabled) {
				this.disabled = true;
				this.vectorForce.Force = new Vector3(0, this.power, 0);
				this.vectorForce.Enabled = true;
				this.particleEmitter.Enabled = true;
				task.wait(this.fuel);
				this.vectorForce.Force = Vector3.zero;
				this.vectorForce.Enabled = false;
				this.particleEmitter.Enabled = false;
			}
		});

		this.onkFirstInputs(["strength", "fuel"], ({ strength, fuel }) => {
			this.power = strength;
			this.fuel = fuel;
		});
	}
}

export const SolidRocketPropellant = {
	...BlockCreation.defaults,
	id: "solidRocketPropellant",
	displayName: "Solid propellant engine",
	description: "This guy quits his job really soon!",
	search: { partialAliases: ["rocket", "propellant", "solid", "🦅"] },
	logic: { definition, ctor: Logic },
	limit: 50,
} as const satisfies BlockBuilder;
