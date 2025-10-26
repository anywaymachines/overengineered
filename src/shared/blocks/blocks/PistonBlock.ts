import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		extend: {
			displayName: "Length",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: 0,
						max: 10,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "smooth",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 2,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "R", value: 10 },
								{ key: "F", value: 0 },
							],
						},
					},
				},
			},
		},
		maxforce: {
			displayName: "Max Force",
			tooltip: "The piston's maximum force as the piston attempts to reach its desired Speed",
			types: {
				number: {
					config: 5000,
					clamp: {
						min: 0,
						max: 20000,
						showAsSlider: true,
					},
				},
			},
		},
		responsiveness: {
			displayName: "Responsiveness",
			tooltip: "Specifies the sharpness of the piston in reaching the max length",
			types: {
				number: {
					config: 45,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type Piston = BlockModel & {
	readonly Top: Part & {
		readonly Beam: Beam;
	};
	readonly Bottom: Part & {
		PrismaticConstraint: PrismaticConstraint;
	};
	readonly ColBox: Part;
};

const updateType = t.intersection(
	t.interface({
		block: t.instance("Model").as<Piston>(),
		force: t.number,
		position: t.number,
		speed: t.number,
		responsiveness: t.number,
	}),
);
type updateType = t.Infer<typeof updateType>;

const update = ({ block, force, position, speed, responsiveness }: updateType) => {
	block.Bottom.PrismaticConstraint.Speed = speed;
	block.Bottom.PrismaticConstraint.TargetPosition = math.clamp(position, 0, 10);
	block.Bottom.PrismaticConstraint.ServoMaxForce = force * 100000;
	block.Bottom.PrismaticConstraint.LinearResponsiveness = responsiveness;
};

export { Logic as PistonBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, Piston> {
	static readonly events = {
		update: new BlockSynchronizer("piston_update", updateType, update),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;

		this.on((ctx) => {
			const speed = 1000;

			Logic.events.update.send({
				block: this.instance,
				force: ctx.maxforce,
				position: ctx.extend,
				speed: speed,
				responsiveness: ctx.responsiveness,
			});
		});

		this.onEnable(() => {
			const beam = this.instance.Top.Beam;
			// default width of the beam at scale 1
			const default_width = 0.4;
			const scale = math.min(blockScale.X, blockScale.Z) * default_width;
			beam.Width0 = scale;
			beam.Width1 = scale;
		});

		this.onDisable(() => block.instance.FindFirstChild("Top")?.FindFirstChild("Beam")?.Destroy());
	}
}

export const PistonBlock = {
	...BlockCreation.defaults,
	id: "piston",
	displayName: "Piston",
	description: "No Pi jokes here. It just moves stuff..",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
