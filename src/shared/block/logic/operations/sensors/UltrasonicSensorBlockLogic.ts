import { RunService, Workspace } from "@rbxts/services";
import { BlockLogicData } from "shared/block/BlockLogic";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import RobloxUnit from "shared/RobloxUnit";

export default class LidarSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.lidarsensor> {
	private raycastParams;
	private ray;

	constructor(block: BlockLogicData<typeof blockConfigRegistry.lidarsensor.input>) {
		super(block, blockConfigRegistry.lidarsensor);
		this.event.subscribe(RunService.Heartbeat, () => this.update());

		this.ray = this.block.instance.FindFirstChild("Ray") as BasePart;
		this.ray.Anchored = true;

		this.raycastParams = new RaycastParams();
		this.raycastParams.FilterDescendantsInstances = [this.block.instance];
		this.raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
	}

	private update() {
		const raycastOrigin = this.block.instance.GetPivot().Position;
		const raycastDirection = this.block.instance
			.GetPivot()
			.LookVector.mul(RobloxUnit.Meters_To_Studs(this.input.max_distance.get()));

		const raycastResult = Workspace.Raycast(raycastOrigin, raycastDirection, this.raycastParams);

		if (raycastResult?.Distance !== undefined) {
			this.ray.Transparency = 0.9;
			this.ray.Size = new Vector3(raycastResult.Distance, 0.1, 0.1);
			this.ray.CFrame = new CFrame(raycastOrigin, raycastResult.Position)
				.mul(new CFrame(0, 0, -raycastResult.Distance / 2))
				.mul(CFrame.Angles(0, math.rad(90), 0));
		} else {
			this.ray.Transparency = 1;
		}

		this.output.distance.set(
			raycastResult?.Distance !== undefined ? RobloxUnit.Studs_To_Meters(raycastResult?.Distance) : -1,
		);
	}
}
