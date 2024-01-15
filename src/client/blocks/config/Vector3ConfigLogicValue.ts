import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";

export class Vector3ConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["vector3"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["vector3"]["config"],
		definition: BlockConfigDefinitionRegistry["vector3"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}
