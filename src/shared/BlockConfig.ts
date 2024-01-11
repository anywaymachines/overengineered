import { BlockConfigDefinition, BlockConfigDefinitionsToConfig } from "./BlockConfigDefinitionRegistry";
import JSON from "./_fixes_/Json";

export default class BlockConfig {
	static deserialize<TDef extends Readonly<Record<string, BlockConfigDefinition>>>(
		block: BlockModel,
		definition: TDef,
	): BlockConfigDefinitionsToConfig<TDef> {
		return JSON.deserializeWithDefaults((block.GetAttribute("config") as string | undefined) ?? "{}", definition);
	}
}
