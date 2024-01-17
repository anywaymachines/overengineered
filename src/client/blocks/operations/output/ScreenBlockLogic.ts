import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class ScreenBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.screen> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.screen);

		const textLabel = this.block.instance
			.FindFirstChild("Part")
			?.FindFirstChild("SurfaceGui")
			?.FindFirstChild("TextLabel") as TextLabel;

		this.event.subscribeObservable(this.input.data, (data) => {
			textLabel.Text = tostring(data);

			// TODO: Sync data with other players
		});
	}
}
