declare namespace BlockConfigTypes {
	type BlockConfigType<TName extends string, TDefault, TConfig> = {
		readonly type: TName;
		readonly default: TDefault;
		readonly config: TConfig;
		readonly connectorHidden?: boolean;
		readonly configHidden?: boolean;
	} & ConfigType<TName, TConfig>;
	type BlockConfigPrimitiveType<TName extends string, TDefault> = BlockConfigType<TName, TDefault, TDefault>;

	export type Bool = BlockConfigPrimitiveType<"bool", boolean>;
	export type Vec3 = BlockConfigPrimitiveType<"vector3", Vector3>;
	export type Key = BlockConfigPrimitiveType<"key", string>;
	export type Number = BlockConfigPrimitiveType<"number", number>;
	export type String = BlockConfigPrimitiveType<"string", string>;
	export type Color = BlockConfigPrimitiveType<"color", Color3>;
	export type Byte = BlockConfigPrimitiveType<"byte", { readonly type: "byte"; readonly value: number }>;
	export type ByteArray = BlockConfigPrimitiveType<"bytearray", readonly number[]> & {
		readonly lengthLimit: number;
	};

	export type MultiKey<TKeys extends string = string> = BlockConfigPrimitiveType<
		"multikey",
		Readonly<Record<TKeys, string>>
	> & {
		readonly keyDefinitions: ConfigTypesToDefinition<string, Readonly<Record<TKeys, Key>>>;
	};

	export type KeyBool = BlockConfigType<
		"keybool",
		boolean,
		{
			readonly key: string;
			readonly switch: boolean;
			readonly touchName: string;
			readonly reversed: boolean;
		}
	> & {
		readonly canBeSwitch: boolean;
		readonly canBeReversed: boolean;
	};

	export type ClampedNumber = BlockConfigPrimitiveType<"clampedNumber", number> & {
		readonly min: number;
		readonly max: number;
		readonly step: number;
	};

	export type OrConfigType<TType extends keyof Types> = Types[TType]["config"];
	export type Or<
		T extends readonly Types[Exclude<keyof Types, "or">][] = readonly Types[Exclude<keyof Types, "or">][],
	> = BlockConfigType<
		"or",
		OrConfigType<T[number]["type"]>,
		{ readonly type: T[number]["type"] | "unset"; readonly value: OrConfigType<T[number]["type"]> }
	> & {
		readonly types: { readonly [k in T[number]["type"]]?: Types[k] };
		readonly group?: string;
	};

	export type MotorRotationSpeed = BlockConfigType<
		"motorRotationSpeed",
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

	export type ServoMotorAngle = BlockConfigType<
		"servoMotorAngle",
		number,
		{
			readonly rotation: {
				readonly add: KeyCode;
				readonly sub: KeyCode;
			};
			readonly switchmode: boolean;
			readonly angle: number;
		}
	>;
	export type Thrust = BlockConfigType<
		"thrust",
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
	export type ControllableNumber = BlockConfigType<
		"controllableNumber",
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
		readonly bool: Bool;
		readonly vector3: Vec3;
		readonly number: Number;
		readonly string: String;
		readonly color: Color;
		readonly clampedNumber: ClampedNumber;
		readonly key: Key;
		readonly multikey: MultiKey;
		readonly keybool: KeyBool;
		readonly or: Or;
		readonly motorRotationSpeed: MotorRotationSpeed;
		readonly servoMotorAngle: ServoMotorAngle;
		readonly thrust: Thrust;
		readonly controllableNumber: ControllableNumber;
		readonly byte: Byte;
		readonly bytearray: ByteArray;
	}
}
