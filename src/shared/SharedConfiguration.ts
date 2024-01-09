import { HttpService } from "@rbxts/services";
import Serializer from "./Serializer";
import Objects from "./_fixes_/objects";

const toJson = <T>(value: T) => HttpService.JSONEncode(value);
const fromJson = <T>(data: string) => HttpService.JSONDecode(data) as T;

/*type Amongus<TDef extends AConfigDefinitions> = ConfigType<string, AConfigDefinitionsToConfig<TDef>> & {
	readonly definition: TDef;
};

const keyBoolDef = {
	key: {
		type: "key",
		default: {
			Desktop: "B",
		},
	},
} as const satisfies AConfigDefinitions;
const keyBool = {
	type: "keyBool",
	default: {
		key: "B",
	},

	serialize(value): string {
		return serializeConfig(value, keyBoolDef);
	},
	deserialize(data: string): { key: KeyCode } {
		return deserializeConfig(data, keyBoolDef);
	},
} as const satisfies ConfigType<string, AConfigDefinitionsToConfig<typeof keyBoolDef>>;
*/
const configTypes = {
	bool: {
		type: "bool",
		default: false as boolean,
		serialize(value: boolean) {
			return value ? "Y" : "N";
		},
		deserialize(data: string) {
			return data === "Y";
		},
	},
	number: {
		type: "number",
		default: 0 as number,
		serialize(value: number) {
			return tostring(value);
		},
		deserialize(data: string) {
			return tonumber(data) ?? 0;
		},
	},
	key: {
		type: "key",
		default: "P" as KeyCode,
		serialize(value: KeyCode) {
			return value;
		},
		deserialize(data: string) {
			return data as KeyCode;
		},
	},
	vector2: {
		type: "vector2",
		default: Vector2.zero,
		serialize(value: Vector2) {
			return toJson(Serializer.Vector2.serialize(value));
		},
		deserialize(data: string) {
			return Serializer.Vector2.deserialize(fromJson(data));
		},
	},
} as const satisfies ConfigTypes;

export default configTypes;

export const deserializeConfig = <TDef extends AConfigDefinitions>(
	data: string,
	definitions: TDef,
): AConfigDefinitionsToConfig<TDef> => {
	const config = HttpService.JSONDecode(data) as Writable<AConfigDefinitionsToConfig<TDef>>;
	for (const [key, def] of Objects.entries(definitions)) {
		config[key] ??= def.default.Desktop ?? configTypes[def.type].default;
	}

	return config;
};

export const serializeConfig = <TDef extends AConfigDefinitions>(
	config: AConfigDefinitionsToConfig<TDef>,
	definitions: TDef,
): string => {
	const strippedConfig = { ...config };
	// TODO: optimize by removing the unnesessary(default) values

	return HttpService.JSONEncode(strippedConfig);
};

// types

export type DefaultConfigTypes = typeof configTypes;
type ConfigTypes = {
	[k in string]: ConfigType<k, unknown>;
};
type ConfigType<TName extends string, TValue> = {
	readonly type: TName;
	default: TValue;
	serialize(this: void, value: TValue): string;
	deserialize(this: void, data: string): TValue;
};

export type AConfigDefinition<T extends keyof DefaultConfigTypes> = {
	readonly type: T;
	readonly default: DefaultConfigValue<DefaultConfigTypes[T]["default"]>;
};
export type AConfigDefinitions = Readonly<Record<string, AConfigDefinition<keyof DefaultConfigTypes>>>;

export type AConfigDefinitionBase = {
	readonly type: string;
	readonly default: DefaultConfigValue<DefaultConfigTypes[keyof DefaultConfigTypes]["default"]>;
};
export type AConfigDefinitionsBase = Readonly<Record<string, AConfigDefinitionBase>>;

export type AConfigDefinitionToType<TDef extends AConfigDefinition<keyof DefaultConfigTypes>> =
	TDef["default"]["Desktop"];
export type AConfigDefinitionsToConfig<TDef extends AConfigDefinitions> = {
	readonly [k in keyof TDef]: AConfigDefinitionToType<TDef[k]>;
};
