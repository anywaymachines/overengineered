import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		explode: {
			displayName: "Explode",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
		flammable: {
			displayName: "Flammable",
			types: {
				bool: {
					config: true,
				},
			},
		},
		impact: {
			displayName: "Impact",
			types: {
				bool: {
					config: true,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type TNTBlock = BlockModel & {
	Part: UnionOperation | BasePart;
};

export type { Logic as TNTBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, TNTBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const mainPart = this.instance.Part;

		const radius = 6 * ((this.instance.Part.Size.X + this.instance.Part.Size.Z) / 4);
		const pressure = 2500 * (this.instance.Part.Size.Z / 2);
		const flammable = this.initializeInputCache("flammable");
		const impact = this.initializeInputCache("impact");

		const explodeTNT = () => {
			RemoteEvents.Explode.send({
				part: mainPart,
				radius: radius,
				pressure: pressure,
				isFlammable: flammable.get(),
			});
			this.disable();
		};

		this.on(({ explode }) => {
			if (!explode) return;
			explodeTNT();
		});

		this.event.subscribe(mainPart.Touched, (part) => {
			if (!impact.get()) return;

			const velocity1 = mainPart.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) explodeTNT();
		});
	}
}

export const OilBarrel = {
	...BlockCreation.defaults,
	id: "oilbarrel",
	displayName: "Oil barrel",
	description: "I will approve you as an 🦅 if you don't hit it hard or make it explode!",
	search: {
		partialAliases: ["Oil", "America", "🦅", "Barrel", "Explosive"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
