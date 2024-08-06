import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RadioTransmitterBlockLogic } from "shared/block/logic/RadioTransmitterBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

RadioTransmitterBlockLogic.sendEvent.invoked.Connect(({ frequency, value }) => {
	RadioRecieverBlockLogic.allRecievers.get(frequency)?.forEach((v) => {
		v.output.value.set(value);
		v.blinkLed();
	});
});

export class RadioRecieverBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.radioreciever> {
	static readonly allRecievers = new Map<number, Set<RadioRecieverBlockLogic>>();
	private readonly colorFade = Color3.fromRGB(0, 0, 0);
	private readonly originalColor;
	private readonly led;

	blinkLed() {
		if (!this.led) return;
		this.led.Color = this.colorFade;
		task.delay(0.1, () => (this.led ? (this.led.Color = this.originalColor) : ""));
	}

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.radioreciever);

		this.led = block.instance.WaitForChild("LED") as BasePart;
		this.originalColor = this.led.Color;

		const changeFrequency = (freq: number, prev: number) => {
			if (!RadioRecieverBlockLogic.allRecievers.get(freq))
				RadioRecieverBlockLogic.allRecievers.set(freq, new Set());
			RadioRecieverBlockLogic.allRecievers.get(prev)?.delete(this);
			RadioRecieverBlockLogic.allRecievers.get(freq)?.add(this);
		};

		this.event.subscribeObservable(this.input.frequency, changeFrequency);

		this.onDisable(() => RadioRecieverBlockLogic.allRecievers.get(this.input.frequency.get())?.delete(this));
	}
}
