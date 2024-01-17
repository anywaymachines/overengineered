import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class KeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["key"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["key"]["config"],
		definition: BlockConfigDefinitionRegistry["key"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
