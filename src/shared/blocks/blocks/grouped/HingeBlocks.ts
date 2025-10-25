import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	inputOrder: ["enableLimits", "lowerAngleLimit", "upperAngleLimit", "restitution"],
	input: {
		enableLimits: {
			displayName: "Angles Limited",
			tooltip: "Enable limits",
			types: {
				bool: { config: false },
			},
		},
		lowerAngleLimit: {
			displayName: "Lower Angle",
			types: {
				number: {
					config: -45,
					clamp: {
						min: -180,
						max: 180,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
		upperAngleLimit: {
			displayName: "Upper Angle",
			types: {
				number: {
					config: 45,
					clamp: {
						min: -180,
						max: 180,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
		restitution: {
			displayName: "Restitution",
			types: {
				number: {
					config: 0,
					clamp: {
						min: 0,
						max: 1,
						showAsSlider: true,
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type HingeBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};

export type { Logic as MotorBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, HingeBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const hinge = this.instance.Base.HingeConstraint;
		this.on(({ enableLimits, lowerAngleLimit, upperAngleLimit, restitution }) => {
			hinge.LimitsEnabled = enableLimits;
			hinge.LowerAngle = lowerAngleLimit;
			hinge.UpperAngle = upperAngleLimit;
			hinge.Restitution = restitution;
		});

		// extra logic to break hinges if too much stress is applied
		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		this.onTicc(() => {
			const base = this.instance.FindFirstChild("BottomPart") as BasePart | undefined;
			const attach = this.instance.FindFirstChild("TopPart") as BasePart | undefined;
			if (!attach || !base) {
				this.disableAndBurn();
				return;
			}

			if (attach.Position.sub(base.Position).Magnitude > 3 * blockScale.Y) {
				RemoteEvents.ImpactBreak.send([base]);
				this.disable();
			}
		});
	}
}

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list: BlockBuildersWithoutIdAndDefaults = {
	hingeblock: {
		displayName: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",

		logic,
	},
	smallhingeblock: {
		displayName: "Small hinge",
		description: "Smaller hinge. La rotación compacta",

		logic,
	},
};

export const HingeBlocks = BlockCreation.arrayFromObject(list);
