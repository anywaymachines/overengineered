import Objects from "../shared/Objects";
import Serializer from "../shared/Serializer";
import Signals from "./event/Signals";

export default class ConfigManager {
	public static serialize<TDef extends Readonly<Record<string, ConfigDefinition>>>(
		config: Readonly<Record<string, unknown>>,
		definition: TDef,
	) {
		const ret: Record<string, string> = {};

		for (const def of Objects.values(definition)) {
			const value = config[def.id];

			if (value === undefined) continue;

			if (def.type === "Bool") {
				ret[def.id] = tostring(value);
			} else if (def.type === "Key") {
				ret[def.id] = tostring((value as Enum.KeyCode).Value);
			} else if (def.type === "Number") {
				ret[def.id] = tostring(value)!;
			}
		}

		return ret;
	}
	public static deserialize<TDef extends Readonly<Record<string, ConfigDefinition>>>(
		config: Readonly<Record<string, string>>,
		definition: TDef,
	) {
		const ret: Record<string, ConfigValues | undefined> = {};

		for (const def of Objects.values(definition)) {
			const value = config[def.id];

			if (value === undefined) {
				ret[def.id] = def.default[Signals.INPUT_TYPE.get()];
			} else if (def.type === "Bool") {
				ret[def.id] = value === "true";
			} else if (def.type === "Key") {
				ret[def.id] = Serializer.EnumKeyCodeSerializer.deserialize(tonumber(value)!);
			} else if (def.type === "Number") {
				ret[def.id] = tonumber(value)!;
			}
		}

		return ret;
	}
}
