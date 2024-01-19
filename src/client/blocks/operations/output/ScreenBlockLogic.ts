import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type Screen = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

export default class ScreenBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.screen, Screen> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.screen);

		const textLabel = this.block.instance.Part.SurfaceGui.TextLabel;
		this.event.subscribeObservable(
			this.input.data,
			(data) => {
				textLabel.Text = tostring(data);

				// TODO: Sync data with other players
			},
			true,
		);
	}
}
