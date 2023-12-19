import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

export default class TNTBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.tnt> {
	constructor(block: Model) {
		super(block, TNTBlockLogic.getConfigDefinition());
	}

	static getConfigDefinition() {
		return blockConfigRegistry.tnt;
	}

	public getKeysDefinition(): KeyDefinitions<ConfigDefinitionToTypes<typeof blockConfigRegistry.tnt>> {
		return {
			explode: {
				keyDown: () => {
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
				},
			},
		};
	}
}
