import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

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
			RadioRecieverBlockLogic.allRecievers.get(prev)?.delete(this);
			if (!RadioRecieverBlockLogic.allRecievers.get(freq))
				RadioRecieverBlockLogic.allRecievers.set(freq, new Set());
			RadioRecieverBlockLogic.allRecievers.get(freq)?.add(this);
		};

		this.event.subscribeObservable(this.input.frequency, changeFrequency);
	}
}
