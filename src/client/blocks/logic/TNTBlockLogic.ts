import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	constructor(block: Model) {
		super(block, TNTBlockLogic.getConfigDefinition());
	}

	protected prepare() {
		super.prepare();

		if (this.config.get("impact")) {
			this.eventHandler.subscribe(this.block.PrimaryPart!.Touched, (part) => {
				const velocity1 = this.block.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
				const velocity2 = part.AssemblyLinearVelocity.Magnitude;

				if (velocity1 > (velocity2 + 1) * 10) {
					this.explode();
				}
			});
		}
	}

	static getConfigDefinition() {
		return blockConfigRegistry.tnt;
	}

	public getKeysDefinition(): KeyDefinitions<ConfigDefinitionToTypes<typeof blockConfigRegistry.tnt>> {
		return {
			explode: {
				keyDown: () => this.explode(),
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
