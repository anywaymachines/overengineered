import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["key"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["key"]["config"],
		definition: BlockConfigDefinitionRegistry["key"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
