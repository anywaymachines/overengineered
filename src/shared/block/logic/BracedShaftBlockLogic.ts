import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class BracedShaftBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.bracedshaft> {
	static readonly events = {
		init: new AutoC2SRemoteEvent<{ readonly block: BlockModel; readonly angle: number }>("bracedshard_init"),
	} as const;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.bracedshaft);
		this.onEnable(() => {
			BracedShaftBlockLogic.init(block.instance, this.input.angle.get());
			BracedShaftBlockLogic.events.init.send({ block: block.instance, angle: this.input.angle.get() });
		});
	}

	static init(block: BlockModel, angle: number) {
		for (let i = 1; i <= 4; i++) {
			const rot = block.WaitForChild(`rot${i}`) as BasePart;
			const weld = rot.WaitForChild("WeldConstraint") as WeldConstraint;
			weld.Enabled = false;

			rot.CFrame = rot.CFrame.mul(CFrame.Angles(math.rad(angle), 0, 0));
			weld.Enabled = true;
		}
	}
}
