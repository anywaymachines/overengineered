import { HttpService } from "@rbxts/services";
import Config from "client/Config";

export default class BlockConfig<TDef extends ConfigDefinitions> extends Config<TDef> {
	readonly block;

	constructor(source: Model, definitions: TDef) {
		const configAttribute = source.GetAttribute("config") as string | undefined;
		const content =
			configAttribute !== undefined
				? (HttpService.JSONDecode(configAttribute) as Readonly<Record<keyof TDef, string>> | undefined)
				: undefined;

		const config = content === undefined ? undefined : Config.deserialize(content, definitions);
		super(config, definitions);

		this.block = source;
	}
}
