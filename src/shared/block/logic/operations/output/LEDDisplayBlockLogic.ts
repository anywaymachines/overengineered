import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

export class LEDDisplayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.leddisplay> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly color: Color3;
			readonly part: BasePart;
		}>("leddisplay_update"),
	} as const;

	private readonly display: BasePart[][] = new Array(8);

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.leddisplay);

		const folder = block.instance.WaitForChild("Display");
		for (let x = 0; x < 8; x++) {
			this.display[x] = new Array(8);
			for (let y = 0; y < 8; y++) {
				this.display[x][y] = folder.WaitForChild(`Pixel x${x}y${y}`) as BasePart;
			}
		}

		const updateState = () => {
			if (!this.input.update.get()) return;

			const color = this.input.color.get();
			LEDDisplayBlockLogic.events.update.send({
				block: block.instance,
				color: Color3.fromRGB(color.X, color.Y, color.Z),
				part: this.display[this.input.posx.get()][this.input.posy.get()],
			});
		};

		this.event.subscribeObservable(this.input.posx, updateState);
		this.event.subscribeObservable(this.input.posy, updateState);
		this.event.subscribeObservable(this.input.color, updateState);
		this.event.subscribeObservable(this.input.update, updateState);
	}
}
