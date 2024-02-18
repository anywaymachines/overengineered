import { Players, RunService } from "@rbxts/services";
import { BlockLogicData } from "shared/block/BlockLogic";
import ConfigurableBlockLogic from "shared/block/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";

export default class OwnerLocatorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.ownerlocator> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.ownerlocator.input>) {
		super(block, blockConfigRegistry.ownerlocator);

		this.event.subscribe(RunService.Heartbeat, () => this.update());

		this.onDescendantDestroyed(() => {
			this.disable();
		});
	}

	private update() {
		if (!this.block.instance.PrimaryPart) return;

		const owner = Players.LocalPlayer;
		const playerPart = owner.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
		if (!playerPart) return;

		const v1 = this.block.instance.GetPivot().PointToObjectSpace(playerPart.Position);
		const v2 = Vector3.zero;

		const xAngle = math.atan2(v2.Y - v1.Y, v2.Z - v1.Z);
		const yAngle = math.atan2(v2.Z - v1.Z, v2.X - v1.X);
		const zAngle = math.atan2(v2.X - v1.X, v2.Y - v1.Y);

		this.output.linear.set(v1);
		this.output.angular.set(
			new Vector3(math.deg(xAngle + math.pi), math.deg(yAngle + math.pi / 2), math.deg(zAngle + math.pi / 2)),
		);
	}
}
