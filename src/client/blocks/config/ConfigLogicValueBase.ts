import ObservableValue from "shared/event/ObservableValue";

export default class ConfigLogicValueBase<T extends ConfigValue> {
	//readonly config: ConfigDefinitionsToConfig<T>
	readonly value: ObservableValue<T>;

	protected constructor(value: ObservableValue<T>) {
		this.value = value;
	}

	/** Connect this node to the other one, so THIS node would be controlling the OTHER node */
	connectTo(other: ConfigLogicValueBase<T>) {
		this.value.subscribe((value) => other.value.set(value));
	}
}
