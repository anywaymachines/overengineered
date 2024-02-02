import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoS2CRemoteEvent } from "shared/event/S2CRemoteEvent";

export default class LampBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lamp> {
	static readonly clientEvents = {
		update: new AutoS2CRemoteEvent<{
			readonly block: BlockModel;
			readonly state: boolean;
			readonly color: Color3 | undefined;
		}>("lamp_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.lamp);

		this.event.subscribeObservable(
			this.input.enabled,
			(enabled) => {
				LampBlockLogic.clientEvents.update.invoked.Fire({
					block: this.instance,
					state: enabled,
					color: this.block.color,
				});
			},
			true,
		);
	}
}
