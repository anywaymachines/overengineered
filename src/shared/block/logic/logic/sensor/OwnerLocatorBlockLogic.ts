import { Players } from "@rbxts/services";
import { RobloxUnit } from "shared/RobloxUnit";
import { BlockLogicData } from "shared/block/BlockLogic";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";

export class OwnerLocatorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.ownerlocator> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.ownerlocator.input>) {
		super(block, blockConfigRegistry.ownerlocator);

		this.onDescendantDestroyed(() => {
			this.disable();
		});
	}

	tick(tick: number): void {
		this.update();
		super.tick(tick);
	}

	private update() {
		if (!this.block.instance.PrimaryPart) return;

		const owner = Players.LocalPlayer;
		const playerPart = owner.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
		if (!playerPart) return;

		const localPosition = this.block.instance
			.GetPivot()
			.mul(CFrame.Angles(-math.pi / 2, 0, math.pi / 2))
			.PointToObjectSpace(playerPart.Position);

		const xa = Vector3.yAxis.Angle(localPosition.mul(new Vector3(0, 1, 1)), Vector3.xAxis);
		const ya = Vector3.zAxis.Angle(localPosition.mul(new Vector3(1, 0, 1)), Vector3.yAxis);
		const za = Vector3.xAxis.Angle(localPosition.mul(new Vector3(1, 1, 0)), Vector3.zAxis);

		this.output.angular.set(new Vector3(math.deg(xa), math.deg(ya), math.deg(za)));

		this.output.linear.set(
			new Vector3(
				RobloxUnit.Studs_To_Meters(localPosition.X),
				RobloxUnit.Studs_To_Meters(localPosition.Y),
				RobloxUnit.Studs_To_Meters(localPosition.Z),
			),
		);
	}
}
