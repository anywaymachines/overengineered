import { RunService } from "@rbxts/services";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";

type Piston = BlockModel & {
	readonly Top: Part & {
		PrismaticConstraint: PrismaticConstraint;
	};
	readonly Beam: Part;
	readonly Bottom: Part;
	readonly ColBox: Part;
};
export class PistonLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.piston, Piston> {
	private readonly top;
	private readonly beam;
	private readonly prismaticConstraint;
	private readonly bottom;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.piston);

		this.onDescendantDestroyed(() => {
			this.update();
			this.disable();
		});

		// Instances
		this.top = this.instance.Top;
		this.beam = this.instance.Beam;
		this.bottom = this.instance.Bottom;
		this.prismaticConstraint = this.instance.Top.PrismaticConstraint;

		this.event.subscribeObservable(
			this.input.maxforce,
			(value) => {
				this.prismaticConstraint.ServoMaxForce = value * 1000;
			},
			true,
		);

		this.event.subscribeObservable(
			this.input.speed,
			(value) => {
				this.prismaticConstraint.Speed = value;
			},
			true,
		);

		this.event.subscribeObservable(
			this.input.distance,
			() => {
				this.update();
			},
			true,
		);

		this.event.subscribeObservable(
			this.input.extend,
			() => {
				this.update();
			},
			true,
		);

		this.event.subscribe(RunService.Heartbeat, () => {
			this.beam.Position = this.bottom.Position.Lerp(this.top.Position, 0.5);
			this.beam.Size = new Vector3(this.top.Position.sub(this.bottom.Position).Magnitude, 0.5, 0.5);
		});
	}

	private update() {
		this.prismaticConstraint.TargetPosition = ((-1 * this.input.distance.get()) / 100) * this.input.extend.get();
	}
}
