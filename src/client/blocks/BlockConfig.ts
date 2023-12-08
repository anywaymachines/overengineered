import { HttpService } from "@rbxts/services";
import Config from "client/Config";

export class BlockConfig<T extends ConfigValueTypes> extends Config<T> {
	constructor(source: Instance, definitions: ConfigTypesToDefinition<T>) {
		const configAttribute = source.GetAttribute("config") as string | undefined;
		const content =
			configAttribute !== undefined
				? (HttpService.JSONDecode(configAttribute) as Readonly<Record<keyof T, string>> | undefined)
				: undefined;

		const config = content === undefined ? undefined : Config.deserialize(content, definitions);
		super(config, definitions);
	}
}
