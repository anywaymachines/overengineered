import { ControllableNumberConfigLogicValue } from "client/blocks/config/ControllableNumberLogicValue";
import { BoolConfigLogicValue } from "./BoolConfigLogicValue";
import { ClampedNumberConfigLogicValue } from "./ClampedNumberConfigLogicValue";
import { ConfigLogicValueBase } from "./ConfigLogicValueBase";
import { KeyBoolConfigLogicValue } from "./KeyBoolConfigLogicValue";
import { KeyConfigLogicValue } from "./KeyConfigLogicValue";
import { MotorRotationSpeedConfigLogicValue } from "./MotorRotationSpeedConfigLogicValue";
import { MultiKeyConfigLogicValue } from "./MultiKeyConfigLogicValue";
import { NumberConfigLogicValue } from "./NumberConfigLogicValue";
import { OrConfigLogicValue } from "./OrConfigLogicValue";
import { ServoMotorAngleConfigLogicValue } from "./ServoMotorAngleConfigLogicValue";
import { StringConfigLogicValue } from "./StringConfigLogicValue";
import { ThrustConfigLogicValue } from "./ThrustConfigLogicValue";
import { Vector3ConfigLogicValue } from "./Vector3ConfigLogicValue";

export type blockConfigRegistryClient = {
	[k in keyof BlockConfigTypes.Types]: typeof ConfigLogicValueBase<BlockConfigTypes.Types[k]>;
};

export const blockConfigRegistryClient = {
	bool: BoolConfigLogicValue,
	vector3: Vector3ConfigLogicValue,
	key: KeyConfigLogicValue,
	multikey: MultiKeyConfigLogicValue,
	keybool: KeyBoolConfigLogicValue,
	number: NumberConfigLogicValue,
	string: StringConfigLogicValue,
	clampedNumber: ClampedNumberConfigLogicValue,
	thrust: ThrustConfigLogicValue,
	motorRotationSpeed: MotorRotationSpeedConfigLogicValue,
	servoMotorAngle: ServoMotorAngleConfigLogicValue,
	or: OrConfigLogicValue,
	controllableNumber: ControllableNumberConfigLogicValue,
} as const satisfies blockConfigRegistryClient;
