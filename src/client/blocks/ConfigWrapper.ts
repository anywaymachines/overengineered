export default class ConfigWrapper<T extends Record<string, unknown>> {
	private readonly definitions: readonly ConfigDefinition[];
	private readonly config: T | undefined;

	constructor(block: Model, definitions: readonly ConfigDefinition[]) {
		this.definitions = definitions;
		// this.config = block.GetAttribute('asldka;sldkal;sdkl;asd') // TODO:
	}

	get<TKey extends keyof T>(key: TKey): T[TKey] {
		return this.config?.[key] ?? (this.definitions as Record<TKey, ConfigDefinition>)[key].default;
	}
}
