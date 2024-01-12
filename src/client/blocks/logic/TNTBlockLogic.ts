import ConfigurableBlockLogic from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";
import { PlacedBlockData } from "shared/building/BlockManager";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.tnt);

		this.event.subscribe(this.instance.PrimaryPart!.Touched, (part) => {
			if (!this.input.impact.value.get()) return;

			const velocity1 = this.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				this.explode();
			}
		});

		this.event.subscribeObservable(this.input.explode.value, (explode) => {
			if (!explode) return;
			this.explode();
		});
	}

	private explode() {
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("TNTBlock")
			.Get("Explode")
			.SendToServer(
				this.instance,
				this.input.radius.value.get(),
				this.input.pressure.value.get(),
				this.input.flammable.value.get(),
			);

		this.disable();
	}
}
