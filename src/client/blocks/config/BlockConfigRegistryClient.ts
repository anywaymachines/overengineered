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
import { StringConfigLogicValue } from "./StringConfigLogicValue";
import { ThrustConfigLogicValue } from "./ThrustConfigLogicValue";
import { Vector3ConfigLogicValue } from "./Vector3ConfigLogicValue";

export type blockConfigRegistryClient = {
	[k in keyof BlockConfigDefinitionRegistry]: {
		readonly input: typeof ConfigLogicValueBase<BlockConfigDefinitionRegistry[k]>;
		readonly createObservable: (
			definition: BlockConfigDefinitionRegistry[k],
		) => ObservableValue<BlockConfigDefinitionRegistry[k]["default"]>;
	};
};

const createObservable = <TDef extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]>(
	definition: TDef,
): ObservableValue<TDef["default"]> => {
	return new ObservableValue(definition.default);
};

const blockConfigRegistryClient = {
	bool: {
		input: BoolConfigLogicValue,
		createObservable,
	},
	vector3: {
		input: Vector3ConfigLogicValue,
		createObservable,
	},
	key: {
		input: KeyConfigLogicValue,
		createObservable,
	},
	multikey: {
		input: MultiKeyConfigLogicValue,
		createObservable,
	},
	keybool: {
		input: KeyBoolConfigLogicValue,
		createObservable,
	},
	number: {
		input: NumberConfigLogicValue,
		createObservable,
	},
	string: {
		input: StringConfigLogicValue,
		createObservable,
	},
	clampedNumber: {
		input: ClampedNumberConfigLogicValue,
		createObservable: (definition) => {
			return new NumberObservableValue(undefined!, definition.min, definition.max, definition.step);
		},
	},
	thrust: {
		input: ThrustConfigLogicValue,
		createObservable,
	},
	motorRotationSpeed: {
		input: MotorRotationSpeedConfigLogicValue,
		createObservable,
	},
	servoMotorAngle: {
		input: ServoMotorAngleConfigLogicValue,
		createObservable,
	},
	or: {
		input: OrMotorAngleConfigLogicValue,
		createObservable,
	},
} as const satisfies blockConfigRegistryClient;

export default blockConfigRegistryClient;
