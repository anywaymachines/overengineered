import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockConfigBothDefinitions, PlacedBlockData2 } from "shared/blockLogic/BlockLogic";

const config = {
	input: {
		disconnect: {
			displayName: "Disconnect",
			defaultType: "keybool",
			types: {
				keybool: {
					config: {
						key: "F",
						reversed: false,
						switch: false,
					},
					default: false,
					canBeReversed: true,
					canBeSwitch: true,
				},
			},
		},
	},
	output: {},
} satisfies BlockConfigBothDefinitions;

export type { DisconnectBlockLogic };
class DisconnectBlockLogic extends BlockLogic<typeof config> {
	static readonly events = {
		disconnect: new AutoC2SRemoteEvent<{ readonly block: BlockModel }>("disconnectblock_disconnect"),
	} as const;

	constructor(block: PlacedBlockData2) {
		super(block, config);

		this.event.subscribeObservable(
			this.input.disconnect,
			({ value }) => {
				if (value) {
					DisconnectBlockLogic.events.disconnect.send({ block: this.instance });
					this.disable();
				}
			},
			true,
		);
	}
}

export const DisconnectBlock = {
	id: "disconnectblock",
	name: "Disconnector",
	description: "Detaches connected parts",

	logic: { config, ctor: DisconnectBlockLogic },
} as const satisfies Block;
