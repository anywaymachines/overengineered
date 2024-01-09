import InputController from "client/controller/InputController";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import ConfigLogicValueBase from "./ConfigLogicValueBase";
import NumberConfigLogicValue from "./NumberConfigLogicValue";

export default class ConfigLogicValue<T extends ConfigValue> extends ConfigLogicValueBase<T> {
	constructor(defaultValue: T) {
		super(new ObservableValue(defaultValue));
	}

	static create<TDef extends ConfigDefinition>(
		config: ConfigDefinitionToConfig<TDef>,
		definition: TDef,
	): ConfigLogicValue<ConfigValueOf<TDef>> {
		const inputType = InputController.inputType.get();

		if (definition.type === "number") {
			return new NumberConfigLogicValue(
				definition.default[inputType] ?? definition.default.Desktop,
				definition.min,
				definition.max,
				definition.step,
			);
		}

		return new ConfigLogicValue(definition.default[inputType] ?? definition.default.Desktop);
	}

	static createOutput<TDef extends ConfigDefinition>(definition: TDef): ObservableValue<ConfigValueOf<TDef>> {
		const inputType = InputController.inputType.get();

		if (definition.type === "number") {
			return new NumberObservableValue(
				definition.default[inputType] ?? definition.default.Desktop ?? 0,
				definition.min,
				definition.max,
				definition.step,
			);
		}
		if (definition.type === "bool" || definition.type === "key") {
			return new ObservableValue(definition.default[inputType] ?? definition.default.Desktop);
		}

		// LEAVE THERE FOR COMPILE ERRORS IN CASE YOU FORGOT A TYPE
		return definition;
	}
}
