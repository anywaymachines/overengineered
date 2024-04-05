import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

type Screen = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

export class ScreenBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.screen, Screen> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: Screen;
			readonly text: string;
			readonly translate: boolean;
		}>("screen_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.screen);

		this.event.subscribeObservable(
			this.input.data,
			(data) => {
				ScreenBlockLogic.events.update.send({
					block: this.instance,
					text: tostring(data),
					translate: typeIs(data, "string"),
				});
			},
			true,
		);
	}
}
