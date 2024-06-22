import { ClientComponent } from "client/component/ClientComponent";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import type { KeyDefinitions } from "client/controller/KeyPressingController";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";
import type { ObservableValue } from "shared/event/ObservableValue";

export abstract class ConfigLogicValueBase<
	T extends
		BlockConfigTypes.Types[keyof BlockConfigTypes.Types] = BlockConfigTypes.Types[keyof BlockConfigTypes.Types],
> extends ClientComponent {
	readonly value: IBlockLogicValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	constructor(observable: IBlockLogicValue<T["default"]>, config: T["config"], definition: T) {
		super();

		this.config = config;
		this.definition = definition;
		this.value = observable;
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [];
	}
}

const keys = new Set<string>(Enum.KeyCode.GetEnumItems().map((v) => v.Name));
namespace Types {
	export class bool extends ConfigLogicValueBase<BlockConfigTypes.Bool> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Bool["default"]>,
			config: BlockConfigTypes.Bool["config"],
			definition: BlockConfigTypes.Bool,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class bytearray extends ConfigLogicValueBase<BlockConfigTypes.ByteArray> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.ByteArray["default"]>,
			config: BlockConfigTypes.ByteArray["config"],
			definition: BlockConfigTypes.ByteArray,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class byte extends ConfigLogicValueBase<BlockConfigTypes.Byte> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Byte["default"]>,
			config: BlockConfigTypes.Byte["config"],
			definition: BlockConfigTypes.Byte,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class clampedNumber extends ConfigLogicValueBase<BlockConfigTypes.ClampedNumber> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.ClampedNumber["default"]>,
			config: BlockConfigTypes.ClampedNumber["config"],
			definition: BlockConfigTypes.ClampedNumber,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class color extends ConfigLogicValueBase<BlockConfigTypes.Color> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Color["default"]>,
			config: BlockConfigTypes.Color["config"],
			definition: BlockConfigTypes.Color,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class controllableNumber extends ConfigLogicValueBase<BlockConfigTypes.ControllableNumber> {
		private readonly controller;

		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.ControllableNumber["default"]>,
			config: BlockConfigTypes.ControllableNumber["config"],
			definition: BlockConfigTypes.ControllableNumber,
		) {
			super(observable, config, definition);

			this.value.set(config.value);
			let amount = config.value;
			let movingUp = false;
			let movingDown = false;

			const update = () => this.value.set(amount);
			const start = (up: boolean) => {
				spawn(() => {
					const step = (definition.max - definition.min) / 100;
					while (up ? movingUp : movingDown) {
						const p = up ? step : -step;
						if (amount + p >= definition.min && amount + p <= definition.max) {
							amount += p;
							update();
						}

						wait(0.05);
					}
				});
			};

			const def = {
				add: {
					key: config.control.add,
					conflicts: "sub",
					keyDown: () => {
						if (movingUp) return;

						movingUp = true;
						start(true);
					},
					keyUp: () => {
						movingUp = false;
					},
				},
				sub: {
					key: config.control.sub,
					conflicts: "add",
					keyDown: () => {
						if (movingDown) return;

						movingDown = true;
						start(false);
					},
					keyUp: () => {
						movingDown = false;
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			this.parent((this.controller = new KeyPressingDefinitionsController(def)));
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return [
				{
					name: this.config.control.add,
					press: () => this.controller.controller.keyDown("add"),
					release: () => this.controller.controller.keyUp("add"),
					isPressed: () => this.controller.controller.isDown("add"),
					toggleMode: false,
				},
				{
					name: this.config.control.sub,
					press: () => this.controller.controller.keyDown("sub"),
					release: () => this.controller.controller.keyUp("sub"),
					isPressed: () => this.controller.controller.isDown("sub"),
					toggleMode: false,
				},
			];
		}

		protected createObservable(): ObservableValue<number> {
			return new NumberObservableValue<number>(
				this.config.value,
				this.definition.min,
				this.definition.max,
				this.definition.step,
			);
		}
	}
	export class keybool extends ConfigLogicValueBase<BlockConfigTypes.KeyBool> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.KeyBool["default"]>,
			config: BlockConfigTypes.KeyBool["config"],
			definition: BlockConfigTypes.KeyBool,
		) {
			super(observable, config, definition);
			this.value.set(config.reversed);

			const isKeyCode = (key: string): key is KeyCode => keys.has(key);
			if (isKeyCode(this.config.key)) {
				if (this.definition.canBeSwitch && this.config.switch) {
					this.event.onKeyDown(this.config.key, () => this.value.set(!this.value.get()));
				} else {
					this.event.onKeyDown(this.config.key, () => this.value.set(!config.reversed));
					this.event.onKeyUp(this.config.key, () => this.value.set(config.reversed));
				}
			}
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return [
				{
					name: this.config.key,
					press: () => this.value.set(true),
					release: () => this.value.set(false),
					isPressed: () => this.value.get(),
					toggleMode: this.definition.canBeSwitch && this.config.switch,
				},
			];
		}
	}
	export class key extends ConfigLogicValueBase<BlockConfigTypes.Key> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Key["default"]>,
			config: BlockConfigTypes.Key["config"],
			definition: BlockConfigTypes.Key,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class motorRotationSpeed extends ConfigLogicValueBase<BlockConfigTypes.MotorRotationSpeed> {
		private readonly controller;

		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.MotorRotationSpeed["default"]>,
			config: BlockConfigTypes.MotorRotationSpeed["config"],
			definition: BlockConfigTypes.MotorRotationSpeed,
		) {
			super(observable, config, definition);
			this.value.set(0);

			const def = {
				add: {
					key: config.rotation.add,
					conflicts: "sub",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(config.speed);
						} else {
							this.value.set(this.value.get() === config.speed ? 0 : config.speed);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
				sub: {
					key: config.rotation.sub,
					conflicts: "add",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(-config.speed);
						} else {
							this.value.set(this.value.get() === -config.speed ? 0 : -config.speed);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			this.parent((this.controller = new KeyPressingDefinitionsController(def)));
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return [
				{
					name: this.config.rotation.add,
					press: () => this.controller.controller.keyDown("add"),
					release: () => this.controller.controller.keyUp("add"),
					isPressed: () => this.controller.controller.isDown("add"),
					toggleMode: this.config.switchmode,
				},
				{
					name: this.config.rotation.sub,
					press: () => this.controller.controller.keyDown("sub"),
					release: () => this.controller.controller.keyUp("sub"),
					isPressed: () => this.controller.controller.isDown("sub"),
					toggleMode: this.config.switchmode,
				},
			];
		}
	}
	export class multikey extends ConfigLogicValueBase<BlockConfigTypes.MultiKey> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.MultiKey["default"]>,
			config: BlockConfigTypes.MultiKey["config"],
			definition: BlockConfigTypes.MultiKey,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class _number extends ConfigLogicValueBase<BlockConfigTypes.Number> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Number["config"]>,
			config: BlockConfigTypes.Number["config"],
			definition: BlockConfigTypes.Number,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class _or extends ConfigLogicValueBase<BlockConfigTypes.Or> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Or["default"]>,
			config: BlockConfigTypes.Or["config"],
			definition: BlockConfigTypes.Or,
		) {
			super(observable, config, definition);

			if (config.type !== "unset") {
				this.value.set(config.value);
			}
		}
	}
	export class servoMotorAngle extends ConfigLogicValueBase<BlockConfigTypes.ServoMotorAngle> {
		private readonly controller;

		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.ServoMotorAngle["default"]>,
			config: BlockConfigTypes.ServoMotorAngle["config"],
			definition: BlockConfigTypes.ServoMotorAngle,
		) {
			super(observable, config, definition);
			this.value.set(0);

			const def = {
				add: {
					key: config.rotation.add,
					conflicts: "sub",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(-config.angle);
						} else {
							this.value.set(this.value.get() === -config.angle ? 0 : -config.angle);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
				sub: {
					key: config.rotation.sub,
					conflicts: "add",
					keyDown: () => {
						if (!config.switchmode) {
							this.value.set(config.angle);
						} else {
							this.value.set(this.value.get() === config.angle ? 0 : config.angle);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							this.value.set(0);
						}
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			this.parent((this.controller = new KeyPressingDefinitionsController(def)));
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return [
				{
					name: this.config.rotation.add,
					press: () => this.controller.controller.keyDown("add"),
					release: () => this.controller.controller.keyUp("add"),
					isPressed: () => this.controller.controller.isDown("add"),
					toggleMode: this.config.switchmode,
				},
				{
					name: this.config.rotation.sub,
					press: () => this.controller.controller.keyDown("sub"),
					release: () => this.controller.controller.keyUp("sub"),
					isPressed: () => this.controller.controller.isDown("sub"),
					toggleMode: this.config.switchmode,
				},
			];
		}
	}
	export class _string extends ConfigLogicValueBase<BlockConfigTypes.String> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.String["default"]>,
			config: BlockConfigTypes.String["config"],
			definition: BlockConfigTypes.String,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
	export class thrust extends ConfigLogicValueBase<BlockConfigTypes.Thrust> {
		private readonly controller;

		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Thrust["default"]>,
			config: BlockConfigTypes.Thrust["config"],
			definition: BlockConfigTypes.Thrust,
		) {
			super(observable, config, definition);

			this.value.set(0);
			let torque = 0;
			let movingUp = false;
			let movingDown = false;

			const update = () => this.value.set(torque);
			const start = (up: boolean) => {
				spawn(() => {
					while (up ? movingUp : movingDown) {
						const p = up ? 1 : -1;
						if (torque + p >= 0 && torque + p <= 100) {
							torque += p;
							update();
						}

						wait(0.05);
					}
				});
			};

			const def = {
				add: {
					key: config.thrust.add,
					conflicts: "sub",
					keyDown: () => {
						if (movingUp) return;

						if (definition.canBeSwitch && config.switchmode) {
							torque = 100;
							update();
						} else {
							movingUp = true;
							start(true);
						}
					},
					keyUp: () => {
						movingUp = false;
					},
				},
				sub: {
					key: config.thrust.sub,
					conflicts: "add",
					keyDown: () => {
						if (movingDown) return;

						if (definition.canBeSwitch && config.switchmode) {
							torque = 0;
							update();
						} else {
							movingDown = true;
							start(false);
						}
					},
					keyUp: () => {
						movingDown = false;
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			this.parent((this.controller = new KeyPressingDefinitionsController(def)));
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return [
				{
					name: this.config.thrust.add,
					press: () => this.controller.controller.keyDown("add"),
					release: () => this.controller.controller.keyUp("add"),
					isPressed: () => this.controller.controller.isDown("add"),
					toggleMode: false,
				},
				{
					name: this.config.thrust.sub,
					press: () => this.controller.controller.keyDown("sub"),
					release: () => this.controller.controller.keyUp("sub"),
					isPressed: () => this.controller.controller.isDown("sub"),
					toggleMode: false,
				},
			];
		}

		protected createObservable(): ObservableValue<number> {
			return new NumberObservableValue<number>(0, 0, 100, 0.01);
		}
	}
	export class vector3 extends ConfigLogicValueBase<BlockConfigTypes.Vec3> {
		constructor(
			observable: IBlockLogicValue<BlockConfigTypes.Vec3["default"]>,
			config: BlockConfigTypes.Vec3["config"],
			definition: BlockConfigTypes.Vec3,
		) {
			super(observable, config, definition);
			this.value.set(config);
		}
	}
}

type Ctor<TKey extends keyof BlockConfigTypes.Types> = new (
	observable: IBlockLogicValue<BlockConfigTypes.Types[TKey]["default"]>,
	config: BlockConfigTypes.Types[TKey]["config"],
	definition: BlockConfigTypes.Types[TKey],
) => ConfigLogicValueBase<BlockConfigTypes.Types[TKey]>;
type blockConfigRegistryClient = { readonly [k in keyof BlockConfigTypes.Types]: Ctor<k> };
export const blockConfigRegistryClient: blockConfigRegistryClient = {
	...Types,
	number: Types._number,
	or: Types._or,
	string: Types._string,
};
