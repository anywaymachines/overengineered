import Objects from "shared/_fixes_/objects";
import ObservableValue from "shared/event/ObservableValue";
import ConfigLogicValue from "./ConfigLogicValue";
import ConfigLogicValueBase from "./ConfigLogicValueBase";

export class InputBlockConfig<TDef extends BlockLogicConfigDefinitions> {
	readonly values: {
		readonly [k in keyof TDef]: ConfigLogicValueBase<TDef[k]["default"]["Desktop"]>;
	};

	constructor(config: ConfigDefinitionsToConfig<TDef>, definitions: TDef) {
		const values: Partial<Record<keyof TDef, ConfigLogicValueBase<ConfigValue>>> = {};
		for (const key of Objects.keys(definitions)) {
			const logic = ConfigLogicValue.create(config[key], definitions[key]);
			logic.value.set(config[key]);

			values[key as keyof typeof values] = logic;
		}
		this.values = values as typeof this.values;
	}
}

export class OutputBlockConfig<TDef extends ConfigDefinitions> {
	readonly values: {
		readonly [k in keyof TDef]: ObservableValue<TDef[k]["default"]["Desktop"]>;
	};

	constructor(definitions: TDef) {
		const values: Partial<Record<keyof TDef, ObservableValue<ConfigValue>>> = {};
		for (const key of Objects.keys(definitions)) {
			const logic = ConfigLogicValue.createOutput(definitions[key]);

			values[key as keyof typeof values] = logic;
		}
		this.values = values as typeof this.values;
	}
}
