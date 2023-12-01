import { HttpService } from "@rbxts/services";
import Signals from "client/event/Signals";

type ConfigToConfigDefinition<T extends Readonly<Record<string, unknown>>> = {
	readonly [k in keyof T]: ConfigDefinition & { default: { Desktop: T[k] } };
};

export default class ConfigWrapper<T extends Record<string, unknown>> {
	private readonly definitions: ConfigToConfigDefinition<T>;
	private readonly config: T | undefined;

	constructor(block: Model, definitions: ConfigToConfigDefinition<T>) {
		this.definitions = definitions;

		const configAttribute = block.GetAttribute("config") as string | undefined;
		this.config =
			configAttribute !== undefined ? (HttpService.JSONDecode(configAttribute) as T | undefined) : undefined;
	}

	get<TKey extends keyof T>(key: TKey): T[TKey] {
		return this.config?.[key] ?? (this.definitions[key].default[Signals.INPUT_TYPE.get()] as T[TKey]);
	}
}
