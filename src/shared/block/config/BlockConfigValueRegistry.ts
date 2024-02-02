import NumberObservableValue from "../../event/NumberObservableValue";
import ObservableValue from "../../event/ObservableValue";
import BlockConfigDefinitionRegistry from "./BlockConfigDefinitionRegistry";

export type BlockConfigValueRegistry = {
	readonly [k in keyof BlockConfigDefinitionRegistry]: (
		definition: BlockConfigDefinitionRegistry[k],
	) => ObservableValue<BlockConfigDefinitionRegistry[k]["default"]>;
};

const createObservable = <TDef extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry]>(
	definition: TDef,
): ObservableValue<TDef["default"]> => {
	return new ObservableValue(definition.default);
};
const BlockConfigValueRegistry = {
	bool: createObservable,
	vector3: createObservable,
	key: createObservable,
	multikey: createObservable,
	keybool: createObservable,
	number: createObservable,
	string: createObservable,
	clampedNumber: (definition) =>
		new NumberObservableValue(definition.default, definition.min, definition.max, definition.step),
	thrust: () => new NumberObservableValue(0, 0, 100, 0.01),
	motorRotationSpeed: createObservable,
	servoMotorAngle: createObservable,
	or: createObservable,
} as const satisfies BlockConfigValueRegistry;
export default BlockConfigValueRegistry;
