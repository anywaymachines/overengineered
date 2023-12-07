import Objects from "shared/Objects";
import {
	ConfigDefinition,
	ConfigDefinitionType,
	ConfigTypesToConfig,
	ConfigTypesToDefinition,
	ConfigValue,
	ConfigValueOf,
	ConfigValueTypes,
	KeyCode,
} from "../shared/Configuration";
import InputController from "./controller/InputController";

export const serializeOne = (value: ConfigValue, definition: ConfigDefinition) => {
	const convertIf = <TType extends keyof ConfigDefinitionType>(
		checkType: TType,
		convert: (value: ConfigValueOf<ConfigDefinitionType[TType]>) => string,
	) => {
		if (definition.type !== checkType) return;
		return convert(value as ConfigValueOf<ConfigDefinitionType[TType]>);
	};

	return (
		//convertIf("key", (value) => value.Name) ??
		convertIf("bool", (value) => (value ? "Y" : "N")) ?? convertIf("number", (value) => tostring(value))!
	);
};

export const deserialize = <T extends ConfigValueTypes>(
	content: Readonly<Record<keyof T, string>>,
	definitions: ConfigTypesToDefinition<T>,
) => {
	const result: Partial<ConfigTypesToConfig<T>> = {};

	for (const [key, value] of Objects.entries(content)) {
		const convertIf = <TType extends keyof ConfigDefinitionType>(
			checkType: TType,
			convert: () => ConfigValueOf<ConfigDefinitionType[TType]>,
		) => {
			if (definitions[key].type !== checkType) return;
			result[key] = convert();
		};

		convertIf("key", () => value as KeyCode);
		convertIf("bool", () => value === "Y");
		convertIf("number", () => tonumber(value)!);
	}

	return result as ConfigTypesToConfig<T>;
};

export class Config<T extends ConfigValueTypes> {
	private readonly definitions: ConfigTypesToDefinition<T>;
	private readonly config: ConfigTypesToConfig<T> | undefined;

	constructor(config: ConfigTypesToConfig<T> | undefined, definitions: ConfigTypesToDefinition<T>) {
		this.definitions = definitions;
		this.config = config;
	}

	public get<TKey extends keyof T>(key: TKey): (typeof this.config & defined)[TKey] {
		return (
			this.config?.[key] ??
			this.definitions[key].default[InputController.inputType.get()] ??
			this.definitions[key].default.Desktop
		);
	}
	public set<TKey extends keyof T>(key: TKey, value: (typeof this.config & defined)[TKey]) {
		if (!this.config) return;
		this.config[key] = value;
	}
}
