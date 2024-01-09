import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	constructor(block: BlockModel) {
		super(block, TNTBlockLogic.getConfigDefinition());

		this.event.subscribe(this.block.PrimaryPart!.Touched, (part) => {
			if (!this.logicConfig.inputs.impact.value.get()) return;

			const velocity1 = this.block.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				this.explode();
			}
		});

		this.event.subscribeObservable(this.logicConfig.inputs.explode.value, (explode) => {
			if (!explode) return;
			this.explode();
		});
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
		Remotes.Client.GetNamespace("Blocks")
			.GetNamespace("TNTBlock")
			.Get("Explode")
			.SendToServer(
				this.block,
				this.config.get("radius"),
				this.config.get("pressure"),
				this.config.get("flammable"),
			);

		this.disable();
	}
}
