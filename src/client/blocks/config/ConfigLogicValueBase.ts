import ComponentContainer from "client/base/ComponentContainer";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";

export abstract class ConfigLogicValueBase<
	T extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry],
> extends ComponentContainer {
	readonly value: ObservableValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	constructor(config: T["config"], definition: T) {
		super();

		this.config = config;
		this.definition = definition;
		this.value = this.createObservable();
	}

	enable() {
		super.enable();
		this.value.triggerChanged();
	}

	protected createObservable(): ObservableValue<T["default"]> {
		return new ObservableValue(undefined!);
	}
}
