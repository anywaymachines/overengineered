import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { RemoteEvents } from "shared/RemoteEvents";
import type { PlacedBlockData } from "shared/building/BlockManager";

export class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.tnt);

		this.event.subscribe(this.instance.PrimaryPart!.Touched, (part) => {
			if (!this.input.impact.get()) return;

			const velocity1 = this.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				this.explode();
			}
		});

		this.event.subscribeObservable(
			this.input.explode,
			(explode) => {
				if (!explode) return;
				this.explode();
			},
			true,
		);
	}

	private explode() {
		if (!this.instance.PrimaryPart) return;

		RemoteEvents.Explode.send({
			part: this.instance.PrimaryPart,
			radius: this.input.radius.get(),
			pressure: this.input.pressure.get(),
			isFlammable: this.input.flammable.get(),
		});

		this.disable();
	}
}
