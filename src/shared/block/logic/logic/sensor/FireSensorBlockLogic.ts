import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RobloxUnit } from "shared/RobloxUnit";
import type { PlacedBlockData } from "shared/building/BlockManager";
import type { FireEffect } from "shared/effects/FireEffect";

@injectable
export class FireSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.firesensor> {
	private fireDuration: number = 0;
	private startTime: number;

	private getDistanceTo = (part: BasePart) => {
		if (this.instance === undefined) return;
		if (part === undefined) return;
		return part.GetPivot().Position.sub(this.instance.GetPivot().Position).Magnitude;
	};

	tick(tick: number): void {
		super.tick(tick);
		const dt = os.clock() - this.startTime;
		if (this.fireDuration > 0) this.fireDuration -= dt;
		this.output.detected.set(this.fireDuration > 0);
		this.startTime = os.clock();
	}

	constructor(block: PlacedBlockData, @inject fireffect: FireEffect) {
		super(block, blockConfigRegistry.firesensor);

		this.startTime = os.clock();

		fireffect.event.s2c.invoked.Connect((args) => {
			const dist = this.getDistanceTo(args.part);
			if (dist === undefined) return;
			if (RobloxUnit.Studs_To_Meters(dist) > this.input.detectionradius.get()) return;
			if (this.fireDuration > (args.duration ?? 0)) return;
			this.fireDuration = args.duration ?? 0;
		});

		this.onDescendantDestroyed(() => {
			this.disable();
		});
	}
}
