export type BlockConfigValueTypeBool = {
	type: "bool";
	default: boolean;
	config: boolean;
};
export type BlockConfigValueTypeVector3 = {
	type: "vector3";
	default: Vector3;
	config: Vector3;
};
export type BlockConfigValueTypeKey = {
	type: "key";
	default: KeyCode;
	config: KeyCode;
};
export type BlockConfigValueTypeMultiKey<TKeys extends string = string> = {
	type: "multikey";
	default: Readonly<Record<TKeys, KeyCode>>;
	config: Readonly<Record<TKeys, KeyCode>>;
	keyDefinitions: BlockConfigRegsToDefinitions<Readonly<Record<TKeys, BlockConfigValueTypeKey>>>;
};
export type BlockConfigValueTypeKeyBool = {
	type: "keybool";
	default: boolean;
	config: {
		key: KeyCode;
		switch: boolean;
	};

	canBeSwitch?: boolean;
};
export type BlockConfigValueTypeNumber = {
	type: "number";
	default: number;
	config: number;
};
export type BlockConfigValueTypeClampedNumber = {
	type: "clampedNumber";
	default: number;
	config: number;
	min: number;
	max: number;
	step: number;
};
export type BlockConfigValueTypeThrust = {
	type: "thrust";
	default: number;
	config: {
		thrust: {
			add: KeyCode;
			sub: KeyCode;
		};
		switchmode: boolean;
		strength: number;
	};
	canBeSwitch: boolean;
};
export type BlockConfigValueTypeMotorRotationSpeed = {
	type: "motorRotationSpeed";
	default: number;
	config: {
		rotate_add: KeyCode;
		rotate_sub: KeyCode;
		speed: number;
		switchmode: boolean;
	};
	maxSpeed: number;
};
export type BlockConfigValueTypeServoMotorAngle = {
	type: "servoMotorAngle";
	default: number;
	config: {
		rotate_add: KeyCode;
		rotate_sub: KeyCode;
		switchmode: boolean;
		angle: number;
	};
};

type OrConfigType<TType extends keyof BlockConfigDefinitionRegistry> = {
	type: TType;
	value: BlockConfigDefinitionRegistry[TType]["default"];
};
export type BlockConfigValueTypeOr<
	T extends readonly BlockConfigDefinitionRegistry[Exclude<
		keyof BlockConfigDefinitionRegistry,
		"or"
	>][] = readonly BlockConfigDefinitionRegistry[Exclude<keyof BlockConfigDefinitionRegistry, "or">][],
> = {
	type: "or";
	types: T;
	default: OrConfigType<T[number]["type"]>;
	config: OrConfigType<T[number]["type"]>;
	group?: string;
};

export default BlockConfigDefinitionRegistry;
type BlockConfigDefinitionRegistry = {
	bool: BlockConfigValueTypeBool;
	vector3: BlockConfigValueTypeVector3;
	number: BlockConfigValueTypeNumber;
	clampedNumber: BlockConfigValueTypeClampedNumber;
	key: BlockConfigValueTypeKey;
	multikey: BlockConfigValueTypeMultiKey;
	keybool: BlockConfigValueTypeKeyBool;
	thrust: BlockConfigValueTypeThrust;
	motorRotationSpeed: BlockConfigValueTypeMotorRotationSpeed;
	servoMotorAngle: BlockConfigValueTypeServoMotorAngle;
	or: BlockConfigValueTypeOr;
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
