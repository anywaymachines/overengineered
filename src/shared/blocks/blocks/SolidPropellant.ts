import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";
const tween = game.GetService("TweenService");

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
	output: {
		burning: {
			displayName: "Burning",
			unit: "Boolean",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type PropellantModel = BlockModel & {
	readonly Base: BasePart & {
		readonly Attachment: Attachment;
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly Fuel: BasePart;
	readonly EffectEmitter: BasePart & {
		readonly Fire: ParticleEmitter;
	};
	readonly ColBox: BasePart;
};

export type { Logic as solidPropellantLogic };
class Logic extends InstanceBlockLogic<typeof definition, PropellantModel> {
	private readonly vectorForce = this.instance.Base.VectorForce;
	private readonly particleEmitter = this.instance.EffectEmitter.Fire;
	private readonly sound = this.instance.Base.Sound;
	// these calmed em down and stop red lines at least
	private power = 0;
	private fuel = 15;
	private disabled = false;
	private fuelColor = this.instance.Fuel.Color;
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
		const colbox = this.instance.ColBox;
		this.onk(["ignite"], ({ ignite }) => {
			if (ignite && !this.disabled) {
				this.disabled = true;
				const ti = new TweenInfo(
					math.clamp(this.fuel, 0.25, 0.5),
					Enum.EasingStyle.Quad,
					Enum.EasingDirection.Out,
					0,
					false,
					0,
				);
				this.vectorForce.Force = new Vector3(0, this.power, 0).mul(colbox.AssemblyMass).mul(7.5);
				this.vectorForce.Enabled = true;
				this.particleEmitter.Enabled = true;
				this.sound.Playing = true;
				this.output.burning.set("bool", true);
				tween.Create(this.instance.Fuel, ti, { Color: Color3.fromRGB(255, 166, 0) }).Play();
				task.delay(math.clamp(this.fuel, 0.1, 0.3), () => {
					this.instance.Fuel.Material = Enum.Material.Neon;
				});
				task.delay(this.fuel, () => {
					tween
						.Create(this.instance.Fuel, ti, {
							Color: this.fuelColor.Lerp(Color3.fromRGB(0, 0, 0), 0.5),
						})
						.Play();
					task.delay(math.clamp(this.fuel, 0.1, 0.3), () => {
						this.instance.Fuel.Material = Enum.Material.Concrete;
					});
					this.vectorForce.Force = Vector3.zero;
					this.vectorForce.Enabled = false;
					this.particleEmitter.Enabled = false;
					this.sound.Playing = false;
					this.output.burning.set("bool", false);
				});
			}
		});

		this.onkFirstInputs(["strength", "fuel"], ({ strength, fuel }) => {
			this.power = strength;
			this.fuel = fuel;
			this.sound.Volume = strength * 0.01 * 1.5;
		});
	}
}

export const SolidRocketPropellant = {
	...BlockCreation.defaults,
	id: "solidrocketpropellant",
	displayName: "Solid propellant engine",
	description: "This guy quits his job really soon! (Exploded by a mistake in code, scared me out)",
	search: { partialAliases: ["rocket", "propellant", "solid", "🦅"] },
	logic: { definition, ctor: Logic },
	limit: 50,
} as const satisfies BlockBuilder;
