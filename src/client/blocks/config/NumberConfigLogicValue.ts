import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["number"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigDefinitionRegistry["number"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
