import ComponentBase from "client/base/ComponentBase";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";

export abstract class ConfigLogicValueBase<
	T extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry],
> extends ComponentBase {
	readonly value: ObservableValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	/** True if this value is being controlled by another logic node */
	protected readonly connected: boolean;

	constructor(config: T["config"], definition: T, connected: boolean) {
		super();

		this.config = config;
		this.definition = definition;
		this.connected = connected;
		this.value = this.createObservable();

		this.event.onPrepare(() => this.value.triggerChanged());
	}

	protected createObservable(): ObservableValue<T["default"]> {
		return new ObservableValue(this.definition.default);
	}
}

class NumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["number"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["number"]["config"],
		definition: BlockConfigDefinitionRegistry["number"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}

class ClampedNumberConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["clampedNumber"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["clampedNumber"]["config"],
		definition: BlockConfigDefinitionRegistry["clampedNumber"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}

	protected createObservable() {
		return new NumberObservableValue(
			this.definition.default,
			this.definition.min,
			this.definition.max,
			this.definition.step,
		);
	}
}

class BoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["bool"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["bool"]["config"],
		definition: BlockConfigDefinitionRegistry["bool"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(config);
		}
	}
}

class KeyBoolConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["keybool"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["keybool"]["config"],
		definition: BlockConfigDefinitionRegistry["keybool"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			if (this.definition.canBeSwitch && this.config.switch) {
				this.event.onKeyDown(this.config.key, () => this.value.set(!this.value.get()));
			} else {
				this.event.onKeyDown(this.config.key, () => this.value.set(true));
				this.event.onKeyUp(this.config.key, () => this.value.set(false));
			}
		}
	}
}

class ThrustConfigLogicValue extends ConfigLogicValueBase<BlockConfigDefinitionRegistry["thrust"]> {
	constructor(
		config: BlockConfigDefinitionRegistry["thrust"]["config"],
		definition: BlockConfigDefinitionRegistry["thrust"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(0);
		}
	}

	protected createObservable(): ObservableValue<number> {
		return new NumberObservableValue(this.definition.default, 0, 100, 0.01);
	}
}

class MotorRotationSpeedConfigLogicValue extends ConfigLogicValueBase<
	BlockConfigDefinitionRegistry["motorRotationSpeed"]
> {
	constructor(
		config: BlockConfigDefinitionRegistry["motorRotationSpeed"]["config"],
		definition: BlockConfigDefinitionRegistry["motorRotationSpeed"],
		connected: boolean,
	) {
		super(config, definition, connected);

		if (!this.connected) {
			this.value.set(0);
		}
	}
}

//

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
} as const satisfies blockConfigRegistryClient;

export default blockConfigRegistryClient;
