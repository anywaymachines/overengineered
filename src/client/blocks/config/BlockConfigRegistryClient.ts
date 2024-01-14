import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import { BoolConfigLogicValue } from "./BoolConfigLogicValue";
import { ClampedNumberConfigLogicValue } from "./ClampedNumberConfigLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";
import { KeyBoolConfigLogicValue } from "./KeyBoolConfigLogicValue";
import { KeyConfigLogicValue } from "./KeyConfigLogicValue";
import { MotorRotationSpeedConfigLogicValue } from "./MotorRotationSpeedConfigLogicValue";
import { NumberConfigLogicValue } from "./NumberConfigLogicValue";
import { ThrustConfigLogicValue } from "./ThrustConfigLogicValue";

export type blockConfigRegistryClient = {
	[k in keyof BlockConfigDefinitionRegistry]: {
		readonly input: typeof ConfigLogicValueBase<BlockConfigDefinitionRegistry[k]>;
		readonly output: (
			definition: BlockConfigDefinitionRegistry[k],
		) => ObservableValue<BlockConfigDefinitionRegistry[k]["default"]>;
	};
};

const blockConfigRegistryClient = {
	bool: {
		input: BoolConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	key: {
		input: KeyConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	keybool: {
		input: KeyBoolConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	number: {
		input: NumberConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	clampedNumber: {
		input: ClampedNumberConfigLogicValue,
		output: (definition) => {
			return new NumberObservableValue(definition.default, definition.min, definition.max, definition.step);
		},
	},
	thrust: {
		input: ThrustConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	motorRotationSpeed: {
		input: MotorRotationSpeedConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
} as const satisfies blockConfigRegistryClient;

export default blockConfigRegistryClient;
