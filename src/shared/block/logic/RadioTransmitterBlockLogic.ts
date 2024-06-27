import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RadioRecieverBlockLogic } from "shared/block/logic/RadioRecieverBlockLogic";
import { AutoS2CRemoteEvent } from "shared/event/S2CRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

const sendEvent = new AutoS2CRemoteEvent<{
	readonly frequency: number;
	readonly value: (
		| BlockConfigTypes.Bool
		| BlockConfigTypes.Number
		| BlockConfigTypes.Vec3
		| BlockConfigTypes.String
		| BlockConfigTypes.Byte
	)["config"];
}>("radio_transmitter_send");

export class RadioTransmitterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radiotransmitter> {
	private readonly colorFade = Color3.fromRGB(0, 0, 0);
	private readonly originalColor;
	private readonly led;

	blinkLed() {
		if (!this.led) return;
		this.led.Color = this.colorFade;
		task.delay(0.1, () => (this.led ? (this.led.Color = this.originalColor) : ""));
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radiotransmitter);

		this.led = block.instance.WaitForChild("LED") as BasePart;
		this.originalColor = this.led.Color;

		this.event.subscribe(sendEvent.invoked, ({ frequency, value }) => {
			this.blinkLed();
			RadioRecieverBlockLogic.allRecievers.get(frequency)?.forEach((v) => {
				v.output.value.set(value);
				v.blinkLed();
			});
		});

		this.event.subscribeObservable(this.input.value, (data) => {
			sendEvent.send({
				frequency: this.input.frequency.get(),
				value: data,
			});
		});
	}
}
