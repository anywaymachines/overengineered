type bool = {
	type: "bool";
	default: boolean;
	config: boolean;
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
		keyUp: KeyCode;
		keyDown: KeyCode;
		isSwitch: boolean;
	};
	canBeSwitch: boolean;
};
type motorRotationSpeed = {
	type: "motorRotationSpeed";
	default: number;
	config: {};
	maxSpeed: number;
};

export default BlockConfigDefinitionRegistry;
type BlockConfigDefinitionRegistry = {
	bool: bool;
	number: _number;
	clampedNumber: clampedNumber;
	keybool: keybool;
	thrust: thrust;
	motorRotationSpeed: motorRotationSpeed;
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
