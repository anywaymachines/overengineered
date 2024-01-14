import ComponentContainer from "client/base/ComponentContainer";
import BlockConfigDefinitionRegistry from "shared/BlockConfigDefinitionRegistry";
import ObservableValue, { ReadonlyObservableValue } from "shared/event/ObservableValue";

export abstract class ConfigLogicValueBase<
	T extends BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry],
> extends ComponentContainer {
	readonly value: ObservableValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	/** True if this value is being controlled by another logic node */
	protected readonly connected: boolean;

	constructor(
		config: T["config"],
		definition: T,
		connected: boolean,
		controlsEnabled?: ReadonlyObservableValue<boolean>,
	) {
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
