type bool = {
	type: "bool";
	default: boolean;
	config: boolean;
};
type key = {
	type: "key";
	default: KeyCode;
	config: KeyCode;
};
type multikey<TKeys extends string = string> = {
	type: "multikey";
	default: Readonly<Record<TKeys, KeyCode>>;
	config: Readonly<Record<TKeys, KeyCode>>;
	keyDefinitions: BlockConfigRegsToDefinitions<Readonly<Record<TKeys, key>>>;
};
type keybool = {
	type: "keybool";
	default: boolean;
	config: {
		key: KeyCode;
		switch: boolean;
	};

	canBeSwitch?: boolean;
};
type _number = {
	type: "number";
	default: number;
	config: number;
};
type clampedNumber = {
	type: "clampedNumber";
	default: number;
	config: number;
	min: number;
	max: number;
	step: number;
};
type thrust = {
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
type motorRotationSpeed = {
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
type servoMotorAngle = {
	type: "servoMotorAngle";
	default: number;
	config: {
		rotate_add: KeyCode;
		rotate_sub: KeyCode;
		switchmode: boolean;
		angle: number;
	};
};

export default BlockConfigDefinitionRegistry;
type BlockConfigDefinitionRegistry = {
	bool: bool;
	number: _number;
	clampedNumber: clampedNumber;
	key: key;
	multikey: multikey;
	keybool: keybool;
	thrust: thrust;
	motorRotationSpeed: motorRotationSpeed;
	servoMotorAngle: servoMotorAngle;
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
