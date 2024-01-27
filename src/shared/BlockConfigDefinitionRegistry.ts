type BlockConfigValueType<TName extends string, TDefault, TConfig, TAdditional extends object = {}> = {
	readonly type: TName;
	readonly default: TDefault;
	readonly config: TConfig;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
} & TAdditional;
type BlockConfigPrimitiveValueType<
	TName extends string,
	TDefault,
	TAdditional extends object = {},
> = BlockConfigValueType<TName, TDefault, TDefault, TAdditional>;

export type BlockConfigValueTypeBool = BlockConfigPrimitiveValueType<"bool", boolean>;
export type BlockConfigValueTypeVector3 = BlockConfigPrimitiveValueType<"vector3", Vector3>;
export type BlockConfigValueTypeKey = BlockConfigPrimitiveValueType<"key", KeyCode>;
export type BlockConfigValueTypeNumber = BlockConfigPrimitiveValueType<"number", number>;
export type BlockConfigValueTypeString = BlockConfigPrimitiveValueType<"string", string>;

export type BlockConfigValueTypeMultiKey<TKeys extends string = string> = BlockConfigPrimitiveValueType<
	"multikey",
	Readonly<Record<TKeys, KeyCode>>,
	{
		readonly keyDefinitions: BlockConfigRegsToDefinitions<Readonly<Record<TKeys, BlockConfigValueTypeKey>>>;
	}
>;
export type BlockConfigValueTypeKeyBool = BlockConfigValueType<
	"keybool",
	boolean,
	{
		readonly key: KeyCode;
		readonly switch: boolean;
		readonly touchName: string;
		readonly reversed: boolean;
	},
	{
		readonly canBeSwitch: boolean;
		readonly canBeReversed: boolean;
	}
>;
export type BlockConfigValueTypeClampedNumber = BlockConfigPrimitiveValueType<
	"clampedNumber",
	number,
	{
		readonly min: number;
		readonly max: number;
		readonly step: number;
	}
>;
export type BlockConfigValueTypeThrust = BlockConfigValueType<
	"thrust",
	number,
	{
		readonly thrust: {
			readonly add: KeyCode;
			readonly sub: KeyCode;
		};
		readonly switchmode: boolean;
	},
	{
		readonly canBeSwitch: boolean;
	}
>;
export type BlockConfigValueTypeMotorRotationSpeed = BlockConfigValueType<
	"motorRotationSpeed",
	number,
	{
		readonly rotation: {
			readonly add: KeyCode;
			readonly sub: KeyCode;
		};
		readonly speed: number;
		readonly switchmode: boolean;
	},
	{
		readonly maxSpeed: number;
	}
>;
export type BlockConfigValueTypeServoMotorAngle = BlockConfigValueType<
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

type OrConfigType<TType extends keyof BlockConfigDefinitionRegistry> = BlockConfigDefinitionRegistry[TType]["default"];
export type BlockConfigValueTypeOr<
	T extends readonly BlockConfigDefinitionRegistry[Exclude<
		keyof BlockConfigDefinitionRegistry,
		"or"
	>][] = readonly BlockConfigDefinitionRegistry[Exclude<keyof BlockConfigDefinitionRegistry, "or">][],
> = BlockConfigPrimitiveValueType<
	"or",
	OrConfigType<T[number]["type"]>,
	{
		readonly types: T;
		readonly group?: string;
	}
>;

export default BlockConfigDefinitionRegistry;
type BlockConfigDefinitionRegistry = {
	readonly bool: BlockConfigValueTypeBool;
	readonly vector3: BlockConfigValueTypeVector3;
	readonly number: BlockConfigValueTypeNumber;
	readonly string: BlockConfigValueTypeString;
	readonly clampedNumber: BlockConfigValueTypeClampedNumber;
	readonly key: BlockConfigValueTypeKey;
	readonly multikey: BlockConfigValueTypeMultiKey;
	readonly keybool: BlockConfigValueTypeKeyBool;
	readonly thrust: BlockConfigValueTypeThrust;
	readonly motorRotationSpeed: BlockConfigValueTypeMotorRotationSpeed;
	readonly servoMotorAngle: BlockConfigValueTypeServoMotorAngle;
	readonly or: BlockConfigValueTypeOr;
};

//

export type BlockConfigDefinition = BlockConfigRegToDefinition<
	BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]
>;
export type BlockConfigRegToDefinition<T extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]> =
	T & {
		readonly displayName: string;
	};
export type BlockConfigRegsToDefinitions<
	T extends Readonly<Record<string, BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]>>,
> = {
	readonly [k in keyof T]: BlockConfigRegToDefinition<T[k]>;
};

export type BlockConfigBothDefinitions = {
	readonly input: BlockConfigDefinitions;
	readonly output: BlockConfigDefinitions;
};

export type BlockConfigDefinitions = Readonly<Record<string, BlockConfigDefinition>>;

export type BlockConfigDefinitionsToConfig<TDef extends BlockConfigDefinitions> = {
	readonly [k in keyof TDef]: TDef[k]["config"];
};
