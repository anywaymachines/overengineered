import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["bool"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigDefinitionRegistry["bool"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
