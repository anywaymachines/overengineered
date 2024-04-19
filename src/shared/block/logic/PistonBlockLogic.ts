import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";

type Piston = BlockModel & {
	readonly Top: Part & {
		readonly Beam: Beam;
	};
	readonly Bottom: Part & {
		PrismaticConstraint: PrismaticConstraint;
	};
	readonly ColBox: Part;
};
export class PistonLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.piston, Piston> {
	static readonly events = {
		updateMaxForce: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly force: number;
		}>("piston_update_max_force"),

		updatePosition: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly position: number;
		}>("piston_update_position"),
	} as const;

	private readonly prismaticConstraint;
	private readonly bottom;

	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.piston);

		this.onDescendantDestroyed(() => {
			block.instance.FindFirstChild("Top")?.FindFirstChild("Beam")?.Destroy();
			this.update();
			this.disable();
		});

		// Instances
		this.bottom = this.instance.Bottom;
		this.prismaticConstraint = this.bottom.PrismaticConstraint;

		this.event.subscribeObservable(
			this.input.maxforce,
			(value) => {
				this.prismaticConstraint.ServoMaxForce = value * 1000;

				PistonLogic.events.updateMaxForce.send({
					block: this.instance,
					force: value * 1000,
				});
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
	}

	private update() {
		this.prismaticConstraint.TargetPosition = (this.input.distance.get() / 100) * this.input.extend.get();

		PistonLogic.events.updatePosition.send({
			block: this.instance,
			position: this.prismaticConstraint.TargetPosition,
		});
	}
}
