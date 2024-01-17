import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class LampBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lamp> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.lamp);

		this.event.subscribeObservable(this.input.enabled, (enabled) => {
			const part = this.instance.PrimaryPart!;

			if (enabled) {
				part.Color = Color3.fromRGB(255, 255, 255);
				part.Material = Enum.Material.Neon;
			} else {
				part.Color = Color3.fromRGB(0, 0, 0);
				part.Material = Enum.Material.SmoothPlastic;
			}

			// TODO: Sync data with other players
		});
	}
}
