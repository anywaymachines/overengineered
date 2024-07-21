import { Workspace } from "@rbxts/services";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class OwnerCameraLocatorBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.ownercameralocator
> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.ownercameralocator.input>) {
		super(block, blockConfigRegistry.ownercameralocator);
		this.onDescendantDestroyed(() => this.disable());
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		this.output.position.set(camera.CFrame.Position.add(new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0)));
		this.output.direction.set(camera.CFrame.LookVector);
		this.output.up.set(camera.CFrame.UpVector);
	}
}
