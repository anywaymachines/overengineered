import { Instances } from "engine/shared/fixes/Instances";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { t } from "engine/shared/t";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		data: {
			displayName: "Data",
			types: BlockConfigDefinitions.any,
		},
		textColor: {
			displayName: "Text Color",
			types: {
				color: {
					config: new Color3(1, 1, 1),
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type ScreenBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

const updateEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<ScreenBlock>(),
	color: t.color,
	data: BlockLogicTypes.T.fromBlockConfigDefinition(definition.input.data.types),
});

const rescaleEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<ScreenBlock>(),
});

type UpdateData = t.Infer<typeof updateEventType>;
type RescaleData = t.Infer<typeof rescaleEventType>;

const update = ({ block, color, data }: UpdateData) => {
	if (!block.FindFirstChild("Part")) {
		return;
	}

	block.Part.SurfaceGui.TextLabel.Text = dataToString(data);
	block.Part.SurfaceGui.TextLabel.TextColor3 = color;
};

const rescale = ({ block }: RescaleData) => {
	const blockScale = BlockManager.manager.scale.get(block) ?? Vector3.one;
	block.Part.SurfaceGui.PixelsPerStud =
		Logic.defaultPixelDensity / math.min(1, math.sqrt(blockScale.X * blockScale.Z));
};

const events = {
	update: new BlockSynchronizer("b_screen_update", updateEventType, update),
	rescale: new BlockSynchronizer("b_screen_rescaled", rescaleEventType, rescale),
} as const;
events.update.sendBackToOwner = true;

export const dataToString = (data: t.Infer<typeof updateEventType.props.data>): string => {
	if (typeIs(data, "string")) {
		return data;
	}
	if (typeIs(data, "Vector3")) {
		return `${dataToString(data.X)}x\n${dataToString(data.Y)}y\n${dataToString(data.Z)}z`;
	}
	if (typeIs(data, "Color3")) {
		return `${dataToString(data.R)}r\n${dataToString(data.G)}g\n${dataToString(data.B)}b`;
	}
	if (typeIs(data, "number")) {
		const isHighPrecision = data % 0.001 !== 0;
		if (isHighPrecision) {
			return `${Strings.prettyNumber(data, 0.001)}..`;
		}
	}
	if (typeIs(data, "table") && "id" in data) {
		return `Sound ${data.id}\n[${data.effects?.size() ?? 0} effects]`;
	}

	return tostring(data);
};

export type { Logic as ScreenBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, ScreenBlock> {
	static readonly dataToString = dataToString;
	static readonly defaultPixelDensity = 80;
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on(({ data, textColor }) => {
			events.update.sendOrBurn({ block: this.instance, color: textColor, data }, this);
		});

		this.onEnable(() => {
			events.rescale.sendOrBurn({ block: this.instance }, this);
		});
	}
}

const immediate = BlockCreation.immediate(definition, (block: ScreenBlock, config) => {
	Instances.waitForChild(block, "Part", "SurfaceGui", "TextLabel");

	events.update.send({
		block,
		color: BlockCreation.defaultIfWiredUnset(config?.textColor, definition.input.textColor.types.color.config),
		data: BlockCreation.defaultIfWiredUnset(config?.data, "Screen"),
	});

	events.rescale.send({
		block,
	});
});

export const ScreenBlock = {
	...BlockCreation.defaults,
	id: "screen",
	displayName: "Screen",
	description: "Display all your data for everyone to see!",

	logic: { definition, ctor: Logic, events, immediate },
} as const satisfies BlockBuilder;
