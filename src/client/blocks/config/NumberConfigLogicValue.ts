import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["number"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigDefinitionRegistry["number"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
