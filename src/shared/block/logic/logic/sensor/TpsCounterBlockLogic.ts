import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class TpsCounterBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tpscounter> {
	private tps = 0;
	private prevTime = 0;

	constructor(block: BlockLogicData<typeof blockConfigRegistry.tpscounter.input>) {
		super(block, blockConfigRegistry.tpscounter);
	}

	tick(tick: number): void {
		super.tick(tick);

		const time = os.clock();
		const dt = time - this.prevTime;
		this.prevTime = time;

		this.tps = (this.tps + 1 / dt) / 2;

		// if fps is not a normal number, reset
		if (this.tps === math.huge || this.tps === -math.huge || this.tps !== this.tps) {
			this.tps = 0;
		}
		this.output.fps.set(this.tps);
	}
}
