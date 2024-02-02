import ComponentContainer from "client/base/ComponentContainer";
import Control from "client/base/Control";
import { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import BlockConfigDefinitionRegistry from "shared/block/config/BlockConfigDefinitionRegistry";
import ObservableValue from "shared/event/ObservableValue";

export abstract class ConfigLogicValueBase<
	T extends
		BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry] = BlockConfigDefinitionRegistry[keyof BlockConfigDefinitionRegistry],
> extends ComponentContainer {
	readonly value: ObservableValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	constructor(observable: ObservableValue<T["default"]>, config: T["config"], definition: T) {
		super();

		this.config = config;
		this.definition = definition;
		this.value = observable;
	}

	enable() {
		super.enable();
		this.value.triggerChanged();
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [];
	}

	/** @deprecated */
	getRideModeGuis(inputType: InputType): readonly Control[] {
		return [];
	}
}
