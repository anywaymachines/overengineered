import ConfigurableBlockLogic, { KeyDefinitions } from "client/base/ConfigurableBlockLogic";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Remotes from "shared/Remotes";

type TNTBlockConfig = ConfigDefinitionToTypes<(typeof blockConfigRegistry)["tnt"]>;

export default class TNTBlockLogic extends ConfigurableBlockLogic<TNTBlockConfig> {
	constructor(block: Model) {
		super(block, TNTBlockLogic.getConfigDefinition());
	}

	static getConfigDefinition(): ConfigTypesToDefinition<TNTBlockConfig> {
		return {
			explode: {
				displayName: "Explode",
				type: "key",
				default: {
					Desktop: "B",
					Gamepad: "ButtonR2",
				},
			},
			radius: {
				displayName: "Explosion radius",
				type: "number",
				default: {
					Desktop: 10,
				},
				min: 0,
				max: 12,
				step: 1,
			},
			pressure: {
				displayName: "Explosion pressure",
				type: "number",
				default: {
					Desktop: 2500,
				},
				min: 0,
				max: 2500,
				step: 1,
			},
			flammable: {
				displayName: "Flammable",
				type: "bool",
				default: {
					Desktop: true,
				},
			},
		};
	}

	public getKeysDefinition(): KeyDefinitions<TNTBlockConfig> {
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
				},
			},
		};
	}
}
