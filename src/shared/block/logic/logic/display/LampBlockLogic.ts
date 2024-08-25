import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class LampBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lamp> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly state: boolean;
			readonly color: Color3 | undefined;
			readonly brightness: number;
			readonly range: number;
		}>("lamp_update"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.lamp);

		const onChange = (isEnableChange: boolean = false) => {
			if (!isEnableChange && !this.input.enabled.get()) return;
			LampBlockLogic.events.update.send({
				block: this.instance,
				state: this.input.enabled.get() === true, // to account the other types
				color: this.block.color,
				brightness: this.input.brightness.get() * 0.4, //a.k.a. /100*40
				range: this.input.lightRrange.get() * 0.6, //a.k.a. /100*60
			});
		};

		this.event.subscribeObservable(this.input.enabled, () => onChange(true));
		this.event.subscribeObservable(this.input.brightness, () => onChange());
		this.event.subscribeObservable(this.input.lightRrange, () => onChange());
	}
}
