import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export class LampBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lamp> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly state: boolean;
			readonly color: Color3 | undefined;
		}>("lamp_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.lamp);

		this.event.subscribeObservable(this.input.enabled, (enabled) => {
			LampBlockLogic.events.update.send({
				block: this.instance,
				state: enabled === true, // to account the other types
				color: this.block.color,
			});
		});
	}
}
