import { ReadonlySignal } from "shared/event/Signal";
import { ConfigValueControl } from "./ConfigValueControl";

type Ctor<TKey extends keyof BlockConfigTypes.Types> = {
	new (
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Types[TKey]["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Types[TKey]>,
	): ConfigValueControl<GuiObject> & {
		readonly submitted: ReadonlySignal<
			(config: Readonly<Record<BlockUuid, BlockConfigTypes.Types[TKey]["config"]>>) => void
		>;
	};
};

type ConfigControlRegistry = {
	readonly [k in keyof BlockConfigTypes.Types]: Ctor<k>;
} & {
	set<TKey extends keyof BlockConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void;
};

export const configControlRegistry: ConfigControlRegistry = {
	set<TKey extends keyof BlockConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void {
		(this as Writable<ConfigControlRegistry>)[key] = value as ConfigControlRegistry[TKey];
	},
} as ConfigControlRegistry;
