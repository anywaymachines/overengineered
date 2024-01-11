import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	private exploded = false;

	constructor(block: BlockModel) {
		super(block, TNTBlockLogic.getConfigDefinition());

		this.event.subscribe(this.block.PrimaryPart!.Touched, (part) => {
			if (!this.input.impact.value.get()) return;

			const velocity1 = this.block.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				this.explode();
			}
		});

		this.event.subscribeObservable(
			this.input.explode.value,
			(explode) => {
				if (!explode) return;
				this.explode();
			},
			true,
		);
	}

	static getConfigDefinition() {
		return blockConfigRegistry.tnt;
	}

	public getKeysDefinition(): KeyDefinitions<typeof blockConfigRegistry.tnt.input> {
		return {
			explode: {
				keyDown: () => {},
			},
		};
	}

	private explode() {
		if (this.exploded) return;
		this.exploded = true;

		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("TNTBlock")
			.Get("Explode")
			.SendToServer(
				this.block,
				this.input.radius.value.get(),
				this.input.pressure.value.get(),
				this.input.flammable.value.get(),
			);

		this.disable();
	}
}
