import { ClientContainerComponent } from "client/component/ClientContainerComponent";
import Control from "client/gui/Control";
import { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import { IBlockLogicValue } from "shared/block/BlockLogicValue";

export abstract class ConfigLogicValueBase<
	T extends
		BlockConfigTypes.Types[keyof BlockConfigTypes.Types] = BlockConfigTypes.Types[keyof BlockConfigTypes.Types],
> extends ClientContainerComponent {
	readonly value: IBlockLogicValue<T["default"]>;
	protected readonly definition: T;
	protected readonly config: T["config"];

	constructor(observable: IBlockLogicValue<T["default"]>, config: T["config"], definition: T) {
		super();

		this.config = config;
		this.definition = definition;
		this.value = observable;
	}

	enable() {
		super.enable();
		this.value.changed.Fire(this.value.get(), this.value.get()); // TODO: remove?
	}

	getTouchButtonDatas(): readonly TouchModeButtonData[] {
		return [];
	}

	/** @deprecated */
	getRideModeGuis(inputType: InputType): readonly Control[] {
		return [];
	}
}
