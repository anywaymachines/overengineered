import { ClientComponent } from "client/component/ClientComponent";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { IBlockLogicValue } from "shared/block/BlockLogicValue";

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
