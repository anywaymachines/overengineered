declare namespace BlockConfigTypes2 {
	type BCType<TDefault, TConfig> = {
		readonly default: TDefault;
		readonly config: TConfig;
	};
	type BCPrimitive<TDefault> = BCType<TDefault, TDefault>;

	export type Unset = BCPrimitive<never>;
	export type Bool = BCPrimitive<boolean>;
	export type Vec3 = BCPrimitive<Vector3>;
	export type Key = BCPrimitive<string>;
	export type Number = BCPrimitive<number>;
	export type String = BCPrimitive<string>;
	export type Color = BCPrimitive<Color3>;
	export type Byte = BCPrimitive<number>;
	export type ByteArray = BCPrimitive<readonly number[]> & {
		readonly lengthLimit: number;
	};

	export type MultiKey<TKeys extends string = string> = BCPrimitive<Readonly<Record<TKeys, string>>> & {
		readonly keyDefinitions: ConfigTypesToDefinition<string, Readonly<Record<TKeys, Key>>>;
	};

	export type KeyBool = BCType<
		boolean,
		{
			readonly key: string;
			readonly switch: boolean;
			readonly reversed: boolean;
		}
	> & {
		readonly canBeSwitch: boolean;
		readonly canBeReversed: boolean;
	};

	export type ClampedNumber = BCPrimitive<number> & {
		readonly min: number;
		readonly max: number;
		readonly step: number;
	};

	export type MotorRotationSpeed = BCType<
		number,
		{
			readonly rotation: {
				readonly add: KeyCode;
				readonly sub: KeyCode;
			};
			readonly speed: number;
			readonly switchmode: boolean;
		}
	> & {
		readonly maxSpeed: number;
	};

	export type ServoMotorAngle = BCType<
		number,
		{
			readonly rotation: {
				readonly add: KeyCode;
				readonly sub: KeyCode;
			};
			readonly switchmode: boolean;
			readonly angle: number;
		}
	> & {
		readonly minAngle: number;
		readonly maxAngle: number;
	};
	export type Thrust = BCType<
		number,
		{
			readonly thrust: {
				readonly add: KeyCode;
				readonly sub: KeyCode;
			};
			readonly switchmode: boolean;
		}
	> & {
		readonly canBeSwitch: boolean;
	};
	export type ControllableNumber = BCType<
		number,
		{
			readonly value: number;
			readonly control: {
				readonly add: KeyCode;
				readonly sub: KeyCode;
			};
		}
	> & {
		readonly min: number;
		readonly max: number;
		readonly step: number;
	};

	//

	export type Definitions = ConfigTypesToDefinition<keyof Types, Types>;
	export type Definition = ConfigTypeToDefinition<Types[keyof Types]>;
	export type BothDefinitions = {
		readonly input: Definitions;
		readonly output: Definitions;
	};

	export interface Types {
		readonly unset: Unset;
		readonly bool: Bool;
		readonly vector3: Vec3;
		readonly number: Number;
		readonly string: String;
		readonly color: Color;
		readonly clampedNumber: ClampedNumber;
		readonly key: Key;
		readonly keybool: KeyBool;
		readonly motorRotationSpeed: MotorRotationSpeed;
		readonly servoMotorAngle: ServoMotorAngle;
		readonly thrust: Thrust;
		readonly controllableNumber: ControllableNumber;
		readonly byte: Byte;
		readonly bytearray: ByteArray;
	}
	export type TypeKeys = keyof Types;
}
