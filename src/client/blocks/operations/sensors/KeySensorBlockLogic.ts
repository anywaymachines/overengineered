import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class KeySensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.keysensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.keysensor);

		this.event.onInput((inputObject) => {
			if (this.config.key.key === inputObject.KeyCode.Name) {
				this.output.result.set(inputObject.UserInputState === Enum.UserInputState.Begin);
			}
		});

		// TODO: Mobile buttons by @i3ym
		// TODO: Hide key input
		// TODO: Toggle mode
	}
}
