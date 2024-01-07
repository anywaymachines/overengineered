import Objects from "shared/_fixes_/objects";
import ObservableValue from "shared/event/ObservableValue";
import ConfigLogicValue from "./ConfigLogicValue";
import ConfigLogicValueBase from "./ConfigLogicValueBase";

export default class BlockConfigWithLogic<TDef extends BlockConfigDefinitions> {
	readonly inputs: Readonly<Record<keyof TDef["input"], ConfigLogicValueBase<ConfigValue>>>;
	readonly outputs: Readonly<Record<keyof TDef["output"], ObservableValue<ConfigValue>>>;

	constructor(inputConfig: ConfigDefinitionsToConfig<TDef["input"]>, definitions: TDef) {
		const inputs: Partial<Record<keyof TDef, ConfigLogicValueBase<ConfigValue>>> = {};
		for (const key of Objects.keys(definitions.input)) {
			const logic = ConfigLogicValue.create(inputConfig[key], definitions.input[key]);
			logic.value.set(inputConfig[key]);

			inputs[key as keyof typeof inputs] = logic;
		}
		this.inputs = inputs as typeof this.inputs;

		const outputs: Partial<Record<keyof TDef, ObservableValue<ConfigValue>>> = {};
		for (const key of Objects.keys(definitions.output)) {
			const logic = ConfigLogicValue.createOutput(definitions.output[key]);
			logic.set(inputConfig[key]);

			outputs[key as keyof typeof outputs] = logic;
		}
		this.outputs = outputs as typeof this.outputs;
	}
}
