import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class LEDDisplayBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.leddisplay> {
	static readonly events = {
		prepare: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
		}>("leddisplay_prepare"), // TODO: fix this shit crap
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly color: Color3;
			readonly frame: Frame;
		}>("leddisplay_update"),
	} as const;

	private readonly display: Frame[][] = new Array(8);

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.leddisplay);

		LEDDisplayBlockLogic.events.prepare.send({
			block: block.instance,
		});

		const gui = block.instance.WaitForChild("Screen").WaitForChild("SurfaceGui");

		for (let x = 0; x < 8; x++) {
			this.display[x] = new Array(8);
			for (let y = 0; y < 8; y++) {
				this.display[x][y] = gui.WaitForChild(`x${x}y${y}`) as Frame;
			}
		}

		const updateState = () => {
			if (!this.input.update.get()) return;

			const color = this.input.color.get();
			LEDDisplayBlockLogic.events.update.send({
				block: block.instance,
				color: Color3.fromRGB(color.X, color.Y, color.Z),
				frame: this.display[this.input.posx.get()][this.input.posy.get()],
			});
		};

		this.event.subscribeObservable(this.input.posx, updateState);
		this.event.subscribeObservable(this.input.posy, updateState);
		this.event.subscribeObservable(this.input.color, updateState);
		this.event.subscribeObservable(this.input.update, updateState);
	}
}
