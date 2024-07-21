import { UserInputService, Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class MouseSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.mousesensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.mousesensor);
	}

	tick(tick: number): void {
		const pos = UserInputService.GetMouseLocation().div(Workspace.CurrentCamera!.ViewportSize);
		this.output.position.set(new Vector3(pos.X, pos.Y, 0));
		this.output.angle.set(math.deg(math.atan2(-(pos.Y - 0.5), pos.X - 0.5)));

		super.tick(tick);
	}
}
