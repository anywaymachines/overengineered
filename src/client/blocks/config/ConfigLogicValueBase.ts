import ObservableValue from "shared/event/ObservableValue";

export default class ConfigLogicValueBase<T extends ConfigValue> {
	//readonly config: ConfigDefinitionsToConfig<T>
	protected disabled = false;
	readonly value: ObservableValue<T>;

	protected constructor(value: ObservableValue<T>) {
		this.value = value;
	}

	/** Connect this node to the other one, so the OTHER node would be controlling THIS node */
	autoSetFrom(other: ObservableValue<T>) {
		other.autoSet(this.value);
		this.disabled = true;
	}
}
