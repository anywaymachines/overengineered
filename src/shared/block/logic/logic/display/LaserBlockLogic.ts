import { RunService, Workspace } from "@rbxts/services";
import { RobloxUnit } from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class LaserBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.laser> {
	private raycastParams;
	private ray;
	private dot;
	private readonly dotSize = 0.3;

	constructor(block: BlockLogicData<typeof blockConfigRegistry.laser.input>) {
		super(block, blockConfigRegistry.laser);
		this.event.subscribe(RunService.Heartbeat, () => this.update());

		this.ray = this.block.instance.FindFirstChild("Ray") as BasePart;
		this.dot = this.block.instance.FindFirstChild("Dot") as BasePart;
		this.ray.Anchored = true;
		this.dot.Anchored = true;
		this.dot.Size = new Vector3(this.dotSize, this.dotSize, this.dotSize);

		this.raycastParams = new RaycastParams();
		this.raycastParams.FilterDescendantsInstances = [this.block.instance];
		this.raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

		this.event.subscribe(this.input.rayColor.changed, (color) => (this.ray.Color = color));
		this.event.subscribe(this.input.dotColor.changed, (color) => (this.dot.Color = color));
	}

	private update() {
		const raycastOrigin = this.block.instance.GetPivot().Position;
		const raycastDirection = this.block.instance
			.GetPivot()
			.UpVector.mul(RobloxUnit.Meters_To_Studs(this.input.maxDistance.get()));

		const raycastResult = Workspace.Raycast(raycastOrigin, raycastDirection, this.raycastParams);
		const distance = raycastResult?.Distance ?? this.input.maxDistance.get();
		const endpos = raycastOrigin.add(this.block.instance.GetPivot().UpVector.mul(distance));

		this.output.distance.set(
			raycastResult?.Distance !== undefined ? RobloxUnit.Studs_To_Meters(raycastResult?.Distance) : -1,
		);

		if (raycastResult?.Distance !== undefined || this.input.alwaysEnabled.get()) {
			this.ray.Transparency = this.input.rayTransparency.get();
			this.ray.Size = new Vector3(distance, 0.1, 0.1);
			this.ray.CFrame = new CFrame(raycastOrigin, endpos)
				.mul(new CFrame(0, 0, -distance / 2))
				.mul(CFrame.Angles(0, math.rad(90), 0));

			this.dot.Transparency = this.input.rayTransparency.get();
			this.dot.CFrame = CFrame.lookAlong(endpos, raycastDirection);
		} else {
			this.ray.Transparency = 1;
			this.dot.Transparency = 1;
		}
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}
}
