import { UserInputService, Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class MouseSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.mousesensor> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.mousesensor);
	}

	tick(tick: number): void {
		const mousePos = UserInputService.GetMouseLocation();
		const relaPos = mousePos.div(Workspace.CurrentCamera!.ViewportSize);

		this.output.position.set(new Vector3(relaPos.X, relaPos.Y, 0));
		this.output.angle.set(math.deg(math.atan2(-(relaPos.Y - 0.5), relaPos.X - 0.5)));

		const camera = Workspace.CurrentCamera;
		if (camera) {
			const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);
			const [x, y, z] = CFrame.lookAt(Vector3.zero, ray.Direction).ToOrientation();

			this.output.direction.set(ray.Direction);
			this.output.angle3d.set(new Vector3(x, y, z));
		}

		super.tick(tick);
	}
}
