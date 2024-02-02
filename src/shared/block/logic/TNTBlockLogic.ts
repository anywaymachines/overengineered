import Remotes from "shared/Remotes";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import { PlacedBlockData } from "shared/building/BlockManager";
import ConfigurableBlockLogic from "../ConfigurableBlockLogic";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
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
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("TNTBlock")
			.Get("Explode")
			.SendToServer(
				this.instance,
				this.input.radius.get(),
				this.input.pressure.get(),
				this.input.flammable.get(),
			);

		this.disable();
	}
}
