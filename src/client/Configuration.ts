import Signals from "./event/Signals";

export type ConfigurationDef<T extends ConfigValues | undefined> = {
	defaultValue: T;
	serialize(value: T): string;
	deserialize(data: string): T;
};

export default class Configuration {
	private static readonly definitions: Partial<
		Record<BaseConfigDefinitions["type"], ConfigurationDef<ConfigValues | undefined>>
	> = {};

	static {
		const set = <TValue extends ConfigValues | undefined>(
			key: BaseConfigDefinitions["type"],
			value: ConfigurationDef<TValue>,
		) => {
			this.definitions[key] = value;
		};

		set("Bool", {
			defaultValue: false as boolean,
			serialize(value) {
				return value ? "true" : "false";
			},
			deserialize(data) {
				return data === "true";
			},
		});
		set("Key", {
			defaultValue: undefined as Enum.KeyCode | undefined,
			serialize(value) {
				return tostring(value?.Value);
			},
			deserialize(data) {
				if (data === undefined) return undefined;

				const val = tonumber(data);
				return Enum.KeyCode.GetEnumItems().find((i) => i.Value === val)!;
			},
		});
		set("Number", {
			defaultValue: 0 as number,
			serialize(value) {
				return tostring(value);
			},
			deserialize(data) {
				return tonumber(data)!;
			},
		});
	}

	public static getDefinitions() {
		return this.definitions as Readonly<typeof this.definitions>;
	}

	public static serialize(value: ConfigValues | undefined, def: ConfigDefinition) {
		return this.definitions[def.type]!.serialize(value);
	}
	public static deserialize(value: string, def: ConfigDefinition) {
		if (value === undefined)
			return def.default[Signals.INPUT_TYPE.get()] ?? this.definitions[def.type]!.defaultValue;

		return this.definitions[def.type]!.deserialize(value);
	}
}
