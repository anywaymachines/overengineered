import { Instances } from "engine/shared/fixes/Instances";
import { MathUtils } from "engine/shared/fixes/MathUtils";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		unit: {
			displayName: "Unit",
			types: {
				enum: {
					config: "studs",
					elementOrder: ["studs", "blocks", "meters", "feet"],
					elements: {
						studs: {
							displayName: "Studs",
							tooltip: "Units are in studs, the default roblox unit, and grid step.",
						},
						blocks: { displayName: "Blocks", tooltip: "Units are in blocks, 2 studs per block" },
						meters: {
							displayName: "Meters",
							tooltip: "The standard metric unit of length, 1 stud is 0.28 meters",
						},
						feet: { displayName: "Feet", tooltip: "WHAT IS A KILOMETER?" },
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type SizeBlockModel = BlockModel & {
	Part: BasePart & {
		Front: SurfaceGui;
		Back: SurfaceGui;
		Left: SurfaceGui;
		Right: SurfaceGui;
		Top: SurfaceGui;
		Bottom: SurfaceGui;
	};
};

const updateType = t.intersection(
	t.interface({
		block: t.instance("Model").as<SizeBlockModel>(),
		ratio: t.number,
	}),
);
type updateType = t.Infer<typeof updateType>;

const update = ({ block, ratio }: updateType) => {
	const setText = (s: SurfaceGui, t: number) => {
		s.FindFirstChildOfClass("TextLabel")!.Text = tostring(MathUtils.round(t, 0.001));
	};
	const blockScale = BlockManager.manager.scale.get(block)?.mul(ratio) ?? Vector3.one;
	const part = block.Part;
	if (!part) return;
	setText(part.Front, blockScale.Z);
	setText(part.Back, blockScale.Z);
	setText(part.Left, blockScale.X);
	setText(part.Right, blockScale.X);
	setText(part.Top, blockScale.Y);
	setText(part.Bottom, blockScale.Y);
};

const events = {
	update: new BlockSynchronizer("sb_update", updateType, update),
};

export type { Logic as SizeBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, SizeBlockModel> {
	static readonly unitRatios: Record<string, number> = {
		studs: 2,
		blocks: 1,
		meters: 0.56,
		feet: 0.56 / 0.3048,
	};

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ unit }) => {
			const ratio = Logic.unitRatios[unit];
			events.update.send({ block: this.instance, ratio });
		});
	}
}

const immediate = BlockCreation.immediate(definition, (block: SizeBlockModel, config) => {
	Instances.waitForChild(block, "Part");
	const ratio =
		Logic.unitRatios[BlockCreation.defaultIfWiredUnset(config?.unit, definition.input.unit.types.enum.config)];
	events.update.send({ block, ratio });
});

export const SizeBlock = {
	...BlockCreation.defaults,
	id: "sizeblock",
	displayName: "Size Block",
	description: "Banana for scale.",
	search: { partialAliases: ["ruler", "length", "width", "height", "measure", "banana", "🍌"] },

	logic: { definition, ctor: Logic, events, immediate },
} as const satisfies BlockBuilder;
