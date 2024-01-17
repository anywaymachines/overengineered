import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class MultiKeyConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["multikey"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["multikey"]["config"],
		definition: BlockConfigDefinitionRegistry["multikey"],
	) {
		super(config, definition);
		this.value.set(config);
	}
}
