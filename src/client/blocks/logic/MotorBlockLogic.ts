import { RunService } from "@rbxts/services";
import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import { UnreliableRemotes } from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";

type MotorBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};
export default class MotorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.motorblock, MotorBlock> {
	private readonly hingeConstraint;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.motorblock);

		this.hingeConstraint = this.instance.Base.HingeConstraint;
		this.event.subscribeObservable(this.input.rotationSpeed, (speed) => {
			this.hingeConstraint.AngularVelocity = speed;
		});

		this.event.subscribe(RunService.Heartbeat, () => {
			if (this.block.instance.Attach.Position.sub(this.block.instance.Base.Position).Magnitude > 3) {
				UnreliableRemotes.ImpactBreak.FireServer(this.block.instance.Base);

				this.disable();
			}
		});
	}
}
