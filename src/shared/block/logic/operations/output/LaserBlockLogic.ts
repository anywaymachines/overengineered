import { RunService, Workspace } from "@rbxts/services";
import { RobloxUnit } from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class LaserBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.laser> {
	private raycastParams;
	private ray;
	private dot;

	constructor(block: BlockLogicData<typeof blockConfigRegistry.laser.input>) {
		super(block, blockConfigRegistry.laser);
		this.event.subscribe(RunService.Heartbeat, () => this.update());

		this.ray = this.block.instance.FindFirstChild("Ray") as BasePart;
		this.dot = this.block.instance.FindFirstChild("Dot") as BasePart;
		this.ray.Anchored = true;
		this.dot.Anchored = true;

		this.raycastParams = new RaycastParams();
		this.raycastParams.FilterDescendantsInstances = [this.block.instance];
		this.raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

		this.event.subscribe(this.input.rayColor.changed, (color) => (this.ray.Color = color));
		this.event.subscribe(this.input.dotColor.changed, (color) => (this.dot.Color = color));
		this.event.subscribe(this.input.dotSize.changed, (size) => (this.dot.Size = new Vector3(size, size, size)));
	}

	private update() {
		const raycastOrigin = this.block.instance.GetPivot().Position;
		const raycastDirection = this.block.instance
			.GetPivot()
			.LookVector.mul(RobloxUnit.Meters_To_Studs(this.input.maxDistance.get()));

		const raycastResult = Workspace.Raycast(raycastOrigin, raycastDirection, this.raycastParams);

		if (raycastResult?.Distance !== undefined) {
			this.ray.Transparency = this.input.rayTransparency.get();
			this.ray.Size = new Vector3(raycastResult.Distance, 0.1, 0.1);
			this.ray.CFrame = new CFrame(raycastOrigin, raycastResult.Position)
				.mul(new CFrame(0, 0, -raycastResult.Distance / 2))
				.mul(CFrame.Angles(0, math.rad(90), 0));

			this.dot.Transparency = this.input.dotTransparency.get();
			this.dot.Size = new Vector3(this.input.dotSize.get(), this.input.dotSize.get(), this.input.dotSize.get());
			this.dot.CFrame = CFrame.lookAlong(raycastResult.Position, raycastDirection);
		} else {
			this.ray.Transparency = 1;
			this.dot.Transparency = 1;
		}
	}
}
