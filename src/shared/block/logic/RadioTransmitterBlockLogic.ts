import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoS2CRemoteEvent } from "shared/event/S2CRemoteEvent";
import { RadioRecieverBlockLogic } from "./RadioRecieverBlockLogic";

const sendEvent = new AutoS2CRemoteEvent<{
	readonly frequency: number;
	readonly value: (
		| BlockConfigTypes.Bool
		| BlockConfigTypes.Number
		| BlockConfigTypes.Vec3
		| BlockConfigTypes.String
	)["config"];
}>("radio_transmitter_send");

export class RadioTransmitterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radiotransmitter> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radiotransmitter);

		this.event.subscribe(sendEvent.invoked, ({ frequency, value }) => {
			RadioRecieverBlockLogic.allRecievers.get(frequency)?.forEach((v) => v.output.value.set(value));
		});

		this.event.subscribeObservable(this.input.value, (data) => {
			sendEvent.send("everyone", {
				frequency: this.input.frequency.get(),
				value: data,
			});
		});
	}
}
