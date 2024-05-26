import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class BracedShaftBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.bracedshaft> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.bracedshaft);

		this.onEnable(() => {
			for (let i = 1; i <= 4; i++) {
				const rot = this.block.instance.WaitForChild(`rot${i}`) as BasePart;
				const weld = rot.WaitForChild("WeldConstraint") as WeldConstraint;
				weld.Enabled = false;

				rot.CFrame = rot.CFrame.mul(CFrame.Angles(math.rad(this.input.angle.get()), 0, 0));
				weld.Enabled = true;
			}
		});
	}
}
