import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import { BoolConfigLogicValue } from "./BoolConfigLogicValue";
import { ClampedNumberConfigLogicValue } from "./ClampedNumberConfigLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";
import { KeyBoolConfigLogicValue } from "./KeyBoolConfigLogicValue";
import { KeyConfigLogicValue } from "./KeyConfigLogicValue";
import { MotorRotationSpeedConfigLogicValue } from "./MotorRotationSpeedConfigLogicValue";
import { MultiKeyConfigLogicValue } from "./MultiKeyConfigLogicValue";
import { NumberConfigLogicValue } from "./NumberConfigLogicValue";
import { OrMotorAngleConfigLogicValue } from "./OrConfigLogicValue";
import { ServoMotorAngleConfigLogicValue } from "./ServoMotorAngleConfigLogicValue";
import { ThrustConfigLogicValue } from "./ThrustConfigLogicValue";
import { Vector3ConfigLogicValue } from "./Vector3ConfigLogicValue";

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
	vector3: {
		input: Vector3ConfigLogicValue,
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
	multikey: {
		input: MultiKeyConfigLogicValue,
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
	servoMotorAngle: {
		input: ServoMotorAngleConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
	or: {
		input: OrMotorAngleConfigLogicValue,
		output: (definition) => {
			return new ObservableValue(definition.default);
		},
	},
} as const satisfies blockConfigRegistryClient;

export default blockConfigRegistryClient;
