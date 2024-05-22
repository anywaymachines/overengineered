import { BoolConfigLogicValue } from "client/blocks/config/BoolConfigLogicValue";
import { ByteArrayConfigLogicValue } from "client/blocks/config/ByteArrayConfigLogicValue";
import { ByteConfigLogicValue } from "client/blocks/config/ByteConfigLogicValue";
import { ClampedNumberConfigLogicValue } from "client/blocks/config/ClampedNumberConfigLogicValue";
import { ColorConfigLogicValue } from "client/blocks/config/ColorConfigLogicValue";
import { ControllableNumberConfigLogicValue } from "client/blocks/config/ControllableNumberLogicValue";
import { KeyBoolConfigLogicValue } from "client/blocks/config/KeyBoolConfigLogicValue";
import { KeyConfigLogicValue } from "client/blocks/config/KeyConfigLogicValue";
import { MotorRotationSpeedConfigLogicValue } from "client/blocks/config/MotorRotationSpeedConfigLogicValue";
import { MultiKeyConfigLogicValue } from "client/blocks/config/MultiKeyConfigLogicValue";
import { NumberConfigLogicValue } from "client/blocks/config/NumberConfigLogicValue";
import { OrConfigLogicValue } from "client/blocks/config/OrConfigLogicValue";
import { ServoMotorAngleConfigLogicValue } from "client/blocks/config/ServoMotorAngleConfigLogicValue";
import { StringConfigLogicValue } from "client/blocks/config/StringConfigLogicValue";
import { ThrustConfigLogicValue } from "client/blocks/config/ThrustConfigLogicValue";
import { Vector3ConfigLogicValue } from "client/blocks/config/Vector3ConfigLogicValue";
import type { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";

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
	color: ColorConfigLogicValue,
	clampedNumber: ClampedNumberConfigLogicValue,
	thrust: ThrustConfigLogicValue,
	motorRotationSpeed: MotorRotationSpeedConfigLogicValue,
	servoMotorAngle: ServoMotorAngleConfigLogicValue,
	or: OrConfigLogicValue,
	controllableNumber: ControllableNumberConfigLogicValue,
	byte: ByteConfigLogicValue,
	bytearray: ByteArrayConfigLogicValue,
} as const satisfies blockConfigRegistryClient;
