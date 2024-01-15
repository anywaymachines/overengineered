import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MultiKeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["multikey"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["multikey"]["config"],
		definition: BlockConfigDefinitionRegistry["multikey"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
