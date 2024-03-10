import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";

export type BlockConfigValueRegistry = {
	readonly [k in keyof BlockConfigTypes.Types]: (
		definition: BlockConfigTypes.Types[k],
	) => ObservableValue<BlockConfigTypes.Types[k]["default"]>;
};

const createObservable = <TDef extends BlockConfigTypes.Types[keyof BlockConfigTypes.Types]>(
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
	thrust: () => new NumberObservableValue<number>(0, 0, 100, 0.01),
	motorRotationSpeed: (def) => new NumberObservableValue<number>(0, 0, def.maxSpeed, 0.01),
	servoMotorAngle: () => new NumberObservableValue<number>(0, -180, 180, 0.01),
	or: createObservable,
} as const satisfies BlockConfigValueRegistry;
export default BlockConfigValueRegistry;
